Server for MAVLink support

Attaches to a MAVLink stream over a serial device and provides endpoints for
the AR portion.

## Endpoints

### `/get_flightplan?sysid={}&compid={}`

Returns a JSON object representing the flight plan for the component at the specified
sys/comp IDs.

### `/position_stream?sysid={}&compid={}`

Returns a multipart JSON stream with most recent position, frequency 1Hz?
socket.io endpoint?
