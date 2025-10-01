from fastapi import FastAPI
import requests
from dotenv import load_dotenv
import pymongo

import os




application = FastAPI()

app = application


load_dotenv()


api_key = os.getenv("WEATHER_API_KEY")
mongo_uri = os.getenv("MONGO_URI")
print(mongo_uri)
client = pymongo.MongoClient(mongo_uri)
db = client.HydroForecast

Users = db.users
tanks = db.tanks
logs = db.logs



for doc in Users.find({}):
    print(doc)



@app.get("/")
def getHome():
    for doc in Users.find({}):
        print(doc)
    return "hello"