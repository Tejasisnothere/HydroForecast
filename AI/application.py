from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

import requests
from dotenv import load_dotenv
import pymongo
import numpy as np
import os
from geopy import Nominatim
from scipy.spatial import KDTree
import pandas as pd
from pydantic import BaseModel
from src.exception import CustomException
import sys
from bson import ObjectId
import asyncio
from contextlib import asynccontextmanager
from fastapi.responses import RedirectResponse
from datetime import datetime


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        yield
    except asyncio.CancelledError:
        print("Server shutdown gracefully")
        raise  

application = FastAPI(lifespan=lifespan)
app = application

load_dotenv()

# ----------------------------
# Environment and DB Setup
# ----------------------------
try:
    api_key = os.getenv("WEATHER_API_KEY")
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        raise ValueError("MONGO_URI not found in .env")

    client = pymongo.MongoClient(mongo_uri)
    db = client.test

    Users = db.users
    tanks = db.tanks
    logs = db.tanklogs

except Exception as e:
    raise CustomException(e, sys)


# ----------------------------
# Pydantic Schema
# ----------------------------
class TankId(BaseModel):
    tankId: str


# ----------------------------
# Function: get_logs
# ----------------------------
def get_logs(tank: TankId):
    try:
        cursor = logs.find({"tank": ObjectId(tank.tankId)})
        data = []
        dates = []
        for log in cursor:
            data.append(log["currentLevel"])
            dates.append(log['timestamp'])
        return data, dates
    except Exception as e:
        raise CustomException(e, sys)


# ----------------------------
# Function: locationBasedGW
# ----------------------------
def locationBasedGW(location):
    try:
        geolocator = Nominatim(user_agent="Tejas")
        location_obj = geolocator.geocode(location)

        if not location_obj:
            raise ValueError(f"Could not geocode location: {location}")

        lat, lon = location_obj.latitude, location_obj.longitude

        df = pd.read_csv("./src/components/artifacts/underground.csv")
        return getGroundwater(df, lat, lon)
    except Exception as e:
        raise CustomException(e, sys)


# ----------------------------
# Function: getGroundwater
# ----------------------------
def getGroundwater(df, lat, lon):
    try:
        points = np.column_stack((df['LATITUDE'], df['LONGITUDE']))
        tree = KDTree(points)

        _, idx = tree.query([lat, lon])

        closest_row = df.iloc[idx]
        gw_value = closest_row['WL(mbgl)']

        return float(gw_value)
    except Exception as e:
        raise CustomException(e, sys)


import requests


def get_rainfall_forecast(location):
    try:
        geolocator = Nominatim(user_agent="Tejas")
        location_obj = geolocator.geocode(location)

        if not location_obj:
            raise ValueError(f"Could not geocode location: {location}")

        lat, lon = location_obj.latitude, location_obj.longitude

        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": lat,
            "longitude": lon,
            "daily": "precipitation_sum",
            "timezone": "auto"
        }

        response = requests.get(url, params=params)
        response.raise_for_status()  
        data = response.json()

        df = pd.DataFrame({
            "date": data["daily"]["time"],
            "rainfall_mm": data["daily"]["precipitation_sum"]
        })

        
        
        arr = df['rainfall_mm'].tolist()

        return arr

    except Exception as e:
        raise Exception(f"Error fetching rainfall forecast: {e}")


# pip install prophet pandas

from prophet import Prophet
import pandas as pd

def predict_future_from_iso(dates, values, forecast_days=10):
    """
    Predicts future values using Prophet, accepting ISO datetime strings.

    Parameters:
        dates (list): List of ISO datetime strings (e.g., "2025-11-03T06:34:46.579000").
        values (list): List of corresponding numeric values.
        forecast_days (int): Number of days to forecast (default: 10).

    Returns:
        dict: {
            "prediction_dates": [list of future dates as 'YYYY-MM-DD'],
            "predicted_values": [list of predicted values]
        }
    """
    if len(dates) != len(values):
        raise ValueError("dates and values must have the same length.")
    if len(values) < 5:
        raise ValueError("Need at least 5 data points for Prophet to work well.")

    # Convert ISO strings → pandas datetime
    parsed_dates = pd.to_datetime(dates, errors='coerce')
    if parsed_dates.isna().any():
        raise ValueError("Some date strings could not be parsed.")

    # Prepare dataframe for Prophet
    df = pd.DataFrame({
        'ds': parsed_dates,
        'y': values
    })

    # Initialize and train Prophet model
    model = Prophet(interval_width=0.8)
    model.fit(df)

    # Predict future
    future = model.make_future_dataframe(periods=forecast_days, freq='D')
    forecast = model.predict(future)

    # Extract future predictions only
    future_forecast = forecast.tail(forecast_days)
    prediction_dates = future_forecast['ds'].dt.strftime('%Y-%m-%d').tolist()
    predicted_values = future_forecast['yhat'].round(2).tolist()

    return {
        "prediction_dates": prediction_dates,
        "predicted_values": predicted_values
    }



# ----------------------------
# Route: /prediction
# ----------------------------

from datetime import datetime, date




# ✅ Robust serializer that converts datetime/date inside lists, dicts, etc.
def serialize_dates(obj):
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    elif isinstance(obj, list):
        return [serialize_dates(item) for item in obj]
    elif isinstance(obj, dict):
        return {key: serialize_dates(value) for key, value in obj.items()}
    else:
        return obj

@app.post("/prediction")
def get_prediction(tank: TankId):
    try:
        # Find tank by ObjectId
        cursor = tanks.find_one({"_id": ObjectId(tank.tankId)})
        if not cursor:
            return {"error": "Tank not found"}

        loc = cursor.get("location")
        if not loc:
            return {"error": "Location missing for this tank"}

        # -------------------- Prediction Logic --------------------
        GW_LEVEL = locationBasedGW(loc)
        rainfall_forecast = get_rainfall_forecast(loc)

        # get_logs returns historical values (dates, logs)
        logs, dates = get_logs(tank)

        # predict_future_from_iso returns predictions for all future points
        predictions = predict_future_from_iso(dates=dates, values=logs)
        pred_dates = predictions["prediction_dates"]
        pred_values = predictions["predicted_values"]

        # -------------------- Return clean response --------------------
        return {
            "tank_id": str(tank.tankId),
            "location": loc,
            "groundwater_level_mbgl": GW_LEVEL,
            "rainfall_forecast": rainfall_forecast,
            "predictions": [
                {"date": d, "predicted_value": v}
                for d, v in zip(pred_dates, pred_values)
            ]
        }

    except Exception as e:
        import traceback
        print("Error:", e)
        print(traceback.format_exc())
        return {"error": str(e)}