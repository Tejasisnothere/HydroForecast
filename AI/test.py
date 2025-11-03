from fastapi import FastAPI
import requests
from dotenv import load_dotenv
import pymongo
import numpy as np
import os
from geopy import Nominatim
from scipy.spatial import KDTree
import pandas as pd

print(os.getcwd())

def locationBasedGW(location):
    geolocator = Nominatim(user_agent="Tejas")
    location = geolocator.geocode(location)
    lat, lon = location.latitude,location.longitude
    df = pd.read_csv("./src/components/artifacts/underground.csv")
    return getGroundwater(df, lat,lon)



def getGroundwater(df, lat, lon):
    points = np.column_stack((df['LATITUDE'], df['LONGITUDE']))
    tree = KDTree(points)


    new_lat, new_lon = lat,lon


    _, idx = tree.query([new_lat, new_lon])


    closest_row = df.iloc[idx]
    return closest_row['WL(mbgl)']


print(locationBasedGW("Mumbai, India"))
