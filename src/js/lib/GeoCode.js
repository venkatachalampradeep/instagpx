function reverseGeocoding(lat, lon, callback) {

    let API_URL = 'https://nominatim.openstreetmap.org/reverse';
    let requestURL = `${API_URL}?format=jsonv2&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`;

    let request = new XMLHttpRequest();
        request.open('GET', requestURL, true);

        request.onreadystatechange = function () {
            if(request.readyState === 4 && request.status === 200) {

                let data = JSON.parse(request.responseText);

                // console.log(data.address)
                let displayName = data.display_name.split(',');
                    displayName = displayName.map(str => str.trim());
                    displayName = displayName.slice(0, 3).join(', ');

                let name = data.name;
                callback({ displayName, name });
            }
        };

        request.onerror = function() {
            return false;
            // console.log("unable to connect to server")
        };
        request.send();
}

export default reverseGeocoding;
