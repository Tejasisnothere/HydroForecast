from fastapi import FastAPI
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
        for log in cursor:
            log["_id"] = str(log["_id"])
            log["tank"] = str(log["tank"])
            data.append(log)
        return data
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



# ----------------------------
# Route: /prediction
# ----------------------------
@app.post("/prediction")
def getStuff(tank: TankId):
    try:
        cursor = tanks.find({"_id": ObjectId(tank.tankId)})

        loc = None
        for t in cursor:
            loc = t.get('location')
            print("Tank ID:", t["_id"])
            print("Location:", loc)

        if not loc:
            raise ValueError("Tank not found or location missing.")

        GW_LEVEL = locationBasedGW(loc)
        print("Groundwater Level (mbgl):", GW_LEVEL)

        arr = get_rainfall_forecast(loc)
        
        return {
            "tank_id": tank.tankId,
            "location": loc,
            "groundwater_level_mbgl": GW_LEVEL,
            "rainfall_forecast": arr,
        }

    except Exception as e:
        raise CustomException(e, sys)
