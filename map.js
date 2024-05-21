var map = L.map('map').setView([-8.8008012, 115.1612023], 10);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 100,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

navigator.geolocation.getCurrentPosition(position => {
    const { coords: { latitude, longitude }} = position;

    var myIcon = L.icon({
        iconUrl: 'icon/your_loc.png',
        iconSize: [35, 40],
        iconAnchor: [16, 10],
    });
    
    var marker = new L.marker([latitude, longitude], {
    draggable: false,
    icon: myIcon,
    autoPan: true
    }).addTo(map);

    map.setView([latitude, longitude], 10);

    marker.bindPopup("<b>You're here!").openPopup();
    console.log(marker);
})

var popup = L.popup()
    .setLatLng([-8.8008012, 115.1612023])
    .setContent("I am a standalone popup.")
    .openOn(map);

function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(map);
}

map.on('click', onMapClick);

var circle = L.circle([-8.8008012, 115.1612023], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 500
}).addTo(map);

circle.bindPopup("Danger Area!");