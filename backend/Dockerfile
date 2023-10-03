FROM python:3.10-alpine

WORKDIR /app

COPY requirements.txt ./

RUN DISABLE_MAVNATIVE=True pip install -r requirements.txt

COPY mavlinkserver.py mavconn.py env.sh ./

ENV PORT=4000
ENV MAVLINK_URL=serial:///dev/ttyACM0:57600/?ids=200,50
ENV FLASK_APP=mavlinkserver
ENV DEBUG_NO_MAVLINK=false
CMD source env.sh && python -m flask run --host=0.0.0.0 --port $PORT --debug
