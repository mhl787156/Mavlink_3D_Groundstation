#!/usr/bin/env python3

import os, threading, time
from dataclasses import dataclass, field
from typing import List
import math
import requests
from io import BytesIO
from PIL import Image

from pymap3d.ned import geodetic2ned

from pymavlink import mavutil
import mavconn

from flask import Flask, jsonify, request, abort
from flask_cors import CORS

app = Flask(__name__)

# Enalbe Cross origin for api endpoints
CORS(app, resources={r"/api/*": {"origins": "http://localhost:8000"}})

@dataclass
class Drone():
    battery: float = -1.0
    mode: str = "Unknown"
    position: List[float] = field(default_factory=lambda: [math.nan] * 3)
    colour: str = "Unknown"


class DroneMonitor(threading.Thread):
    def run(self):
        self.drones = {}
        self.matching = False
        self.last_heartbeat_time = time.time() - 10.0
        self.master = mavconn.get_mavlink_connection(os.environ['MAVLINK_URL'])

        while True:
            self.check_heartbeat()
            msg = self.recv()
            if msg is None:
                continue
            if not hasattr(msg,'name'):
                continue
            # print(msg,flush=True)
            if msg.name == "HEARTBEAT":
                self.handle_heartbeat(msg)
            if msg.name == "SYS_STATUS":
                self.handle_status(msg)
            if msg.name == "GLOBAL_POSITION_INT":
                self.handle_position(msg)
            if msg.name == "PARAM_VALUE":
                self.handle_param(msg)

    @staticmethod
    def _get_drone_key(sys_id,comp_id):
        return "{}/{}".format(sys_id,comp_id)

    def _get_drone(self,msg):
        key = self._get_drone_key(msg.get_srcSystem(),msg.get_srcComponent())
        if key not in self.drones:
            self.drones[key] = Drone()
            self.master.mav.command_long_send(1,0,511,0, 1,1000000,0,0,0,0,0)
            self.master.mav.command_long_send(1,0,511,0,33, 500000,0,0,0,0,0)
        return self.drones[key]

    def handle_heartbeat(self,msg):
        if msg.type == mavutil.mavlink.MAV_TYPE_GCS:
            return
        drone = self._get_drone(msg)
        drone.mode = str(msg.base_mode)

    def handle_status(self,msg):
        drone = self._get_drone(msg)
        drone.battery = msg.voltage_battery / 1000

    def handle_position(self,msg):
        drone = self._get_drone(msg)
        drone.position = [msg.lat,msg.lon,msg.alt]
        drone.velocity = [msg.vx/100, msg.vy/100, msg.vz/100]

    def handle_param(self,msg):
        drone = self._get_drone(msg)
        if msg.param_id != "SCR_USER1":
            return
        colours = {
            1: "green",
            2: "amber",
            3: "red",
            4: "amber_flash",
            5: "red_flash",
        }
        drone.colour = colours[int(msg.param_value)]

    def check_heartbeat(self):
        if time.time() - self.last_heartbeat_time >= 1.0:
            self.master.mav.heartbeat_send(mavutil.mavlink.MAV_TYPE_ONBOARD_CONTROLLER, mavutil.mavlink.MAV_AUTOPILOT_INVALID,0,0,0)
            self.last_heartbeat_time = time.time()

    def recv(self,match=None):
        if match == None and self.matching == False:
            return self.master.recv_msg()
        else:
            self.matching = True
            result = self.master.recv_match(type=match)
            self.matching = False
            return result

    def get_flightplan(self,
        target_system: int, target_component: int,
        lat_0: float, long_0: float, alt_0: float
    ):
        flightplan = []

        while True:
            self.master.mav.mission_request_list_send(
                target_system,target_component
            )
            msg = self.recv("MISSION_COUNT")
            if msg != None:
                break
        num_items = msg.count

        for i in range(num_items):
            while True:
                self.master.mav.mission_request_int_send(
                    target_system,target_component,
                    i
                )

                msg = self.recv("MISSION_ITEM_INT")
                if msg != None:
                    break

            # TODO: handle MAV_CMD_NAV_LOITER_UNLIM, MAV_CMD_NAV_LOITER_TURNS, MAV_CMD_NAV_LOITER_TIME etc.
            # TODO: handle altitude modes
            if msg.command == mavutil.mavlink.MAV_CMD_NAV_WAYPOINT:
                [x,y,z] = geodetic2ned(
                    float(msg.x*1e-7), float(msg.y*1e-7), float(msg.z),
                    lat_0, long_0, alt_0
                    )
                flightplan.append({
                    "index": i,
                    "x": x,
                    "y": y,
                    "z": z,
                })

        return flightplan


if os.getenv("DEBUG_NO_MAVLINK") == "false":
    dronemon = DroneMonitor()
    dronemon.start()
else:
    dronemon = None

@app.route("/get_flightplan")
def get_flightplan():
    system_id = int(request.args.get('sysid'))
    component_id = int(request.args.get('compid'))

    lat_0 = float(request.args.get('lat_0'))
    long_0 = float(request.args.get('long_0'))
    alt_0 = float(request.args.get('alt_0'))

    if not dronemon:
        abort(400, "DRONE MONITOR NOT STARTED")

    return jsonify(
        dronemon.get_flightplan(system_id,component_id,lat_0,long_0,alt_0)
    )


@app.route("/drones")
def get_drones():
    if not dronemon:
        abort(400, "DRONE MONITOR NOT STARTED")

    return jsonify([ k for k in dronemon.drones.keys() ])

@app.route("/drone")
def get_drone():
    system_id = int(request.args.get('sysid'))
    component_id = int(request.args.get('compid'))

    if not dronemon:
        abort(400, "DRONE MONITOR NOT STARTED")

    key = dronemon._get_drone_key(system_id,component_id)
    if key in dronemon.drones:
        drone = dronemon.drones[key]
        return jsonify({
            "battery": drone.battery,
            "mode": drone.mode,
            "position": [
                float(drone.position[0]*1e-7),
                float(drone.position[1]*1e-7),
                float(drone.position[2]*1e-3)
            ],
            "velocity": drone.velocity,
        })
    else:
        return jsonify(
            {}
        )

@app.route("/drone_rel")
def get_drone_rel():
    system_id = int(request.args.get('sysid'))
    component_id = int(request.args.get('compid'))

    if not dronemon:
        abort(400, "DRONE MONITOR NOT STARTED")

    key = dronemon._get_drone_key(system_id,component_id)
    if key in dronemon.drones:
        drone = dronemon.drones[key]
        lat_0 = float(request.args.get('lat_0'))
        long_0 = float(request.args.get('long_0'))
        alt_0 = float(request.args.get('alt_0'))
        position = geodetic2ned(
                    float(drone.position[0]*1e-7), float(drone.position[1]*1e-7), float(drone.position[2]*1e-3),
                    lat_0, long_0, alt_0
                    )
        return jsonify({
            "battery": drone.battery,
            "mode": drone.mode,
            "position": position,
            "velocity": drone.velocity,
        })
    else:
        return jsonify(
            {}
        )

def deg2tile_fraction(lat_deg, lon_deg, zoom):
    lat_rad = math.radians(lat_deg)
    n = 1 << zoom
    xfrac = (lon_deg + 180.0) / 360.0 * n
    yfrac = (1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n
    return xfrac, yfrac

def deg2num(lat_deg, lon_deg, zoom):
    xfrac, yfrac = deg2tile_fraction(lat_deg, lon_deg, zoom)
    return int(xfrac), int(yfrac)

def num2deg(xtile, ytile, zoom):
    n = 1 << zoom
    lon_deg = xtile / n * 360.0 - 180.0
    lat_rad = math.atan(math.sinh(math.pi * (1 - 2 * ytile / n)))
    lat_deg = math.degrees(lat_rad)
    return lat_deg, lon_deg

image = None
satellite_image = None

@app.route('/api/elevationData', methods=['GET'])
def get_elevation_data():

    lat = float(request.args.get('lat'))
    long = float(request.args.get('long'))
    zoom = int(request.args.get('zoom'))

    # Get Map Tile Number
    x_tile, y_tile = deg2num(lat, long, zoom)

    # Get location of lat long within the tile
    xfrac, yfrac = deg2tile_fraction(lat, long, zoom)
    xfrac = xfrac - x_tile # 0 < x < 1
    yfrac = yfrac - y_tile # 0 < y < 1

    # Replace 'YOUR_MAPBOX_ACCESS_TOKEN' with your Mapbox access token
    mapbox_access_token = os.getenv("MAPBOX_ACCESS_TOKEN", None)
    if mapbox_access_token is None:
        abort(200, "Mapbox access token not found")

    # Replace 'YOUR_MAPBOX_ELEVATION_API_ENDPOINT' with the appropriate Mapbox Elevation API endpoint
    mapbox_elevation_endpoint = f'https://api.mapbox.com/v4/mapbox.mapbox-terrain-dem-v1/{zoom}/{x_tile}/{y_tile}.pngraw'
    mapbox_satellite_endpoint = f'https://api.mapbox.com/v4/mapbox.satellite/{zoom}/{x_tile}/{y_tile}.jpg'

    global image
    global satellite_image
    if image is None:
        # Make a request to the Mapbox API to fetch the elevation map in PNG format
        response = requests.get(mapbox_elevation_endpoint, params={'access_token': mapbox_access_token})
        if response.status_code != 200:
            abort(200, 'Failed to fetch elevation data')

        # Read the PNG image and calculate elevations
        image = Image.open(BytesIO(response.content))

        # Make a request to the Mapbox API to fetch the satellite map in PNG format
        response = requests.get(mapbox_satellite_endpoint, params={'access_token': mapbox_access_token})
        print(response)
        if response.status_code != 200:
            abort(200, 'Failed to fetch Satellite data')

        satellite_image = Image.open(BytesIO(response.content))


    width, height = image.size

    pixels = list(image.getdata())
    elevations = []

    for pixel in pixels:
        # Calculate elevation using the formula provided
        elevation = -10000 + ((pixel[0] * 256 * 256 + pixel[1] * 256 + pixel[2]) * 0.1)
        elevations.append(elevation)

    # Return the elevation data as JSON
    return jsonify(width=width, height=height,
                   xcenter=width*xfrac, ycenter=height*yfrac,
                   elevationData=elevations,
                   satelliteImage=list(satellite_image.getdata()))
