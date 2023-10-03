// src/map.js
// import mapboxgl from 'mapbox-gl';

class MapManager {

    constructor(backend_host, backend_port, lat, long, zoom) {
        this.backend_url = 'http://'+backend_host+":" + backend_port

        this.setLatLongZoom(lat, long, zoom)
    }

    setLatLongZoom(lat, long, zoom) {
        this.lat = lat
        this.long = long
        this.zoom = zoom
    }

    fetchElevationData(callback) {

        const params = new URLSearchParams();
        params.append('lat', this.lat)
        params.append('long', this.long)
        params.append('zoom', this.zoom)
        const url = this.backend_url + "/api/elevationData?"+params.toString()

        // Example client-side code to fetch data from your server
        fetch(url) // Replace with your server's endpoint
            .then(response => response.json())
            .then(data => {
                // Handle the data received from the server
                console.log(data);
                callback(data);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }

}

export default MapManager