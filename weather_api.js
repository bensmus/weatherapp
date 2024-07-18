// Given a city name, show the day length circle chart (e.g. https://en.wikipedia.org/wiki/Twilight).
// Have a search bar.

// Fetching JSON data from an API endpoint in JavaScript in web browser.

/*
Free plan of weatherapi: 
- Forecast: 3 days with daily and hourly intervals.
- Historical: last 7 days are shown.
*/

/* E.g. Current weather in Paris, using convention of REST API query string parameters:
$ curl "$baseURL$apiMethod?q=$q&key=$key"
{"location":{"name":"Paris","region":"Ile-de-France","country":"France","lat":48.87,"lon":2.33,"tz_id":"Europe/Paris","localtime_epoch":1714331246,"localtime":"2024-04-28 21:07"},"current":{"last_updated_epoch":1714330800,"last_updated":"2024-04-28 21:00","temp_c":11.0,"temp_f":51.8,"is_day":0,"condition":{"text":"Light rain","icon":"//cdn.weatherapi.com/weather/64x64/night/296.png","code":1183},"wind_mph":5.6,"wind_kph":9.0,"wind_degree":260,"wind_dir":"W","pressure_mb":1015.0,"pressure_in":29.97,"precip_mm":0.0,"precip_in":0.0,"humidity":82,"cloud":0,"feelslike_c":8.8,"feelslike_f":47.8,"vis_km":10.0,"vis_miles":6.0,"uv":1.0,"gust_mph":17.3,"gust_kph":27.8}}
// Also, you can search it up in a modern web browser and it will display JSON.
*/

// Elements that form the skeleton of the page:
const cityInput = document.getElementById('city-input') // Search for cities.
const cityList = document.getElementById('cities') // Dropdown for city search.
const citySearchButton = document.getElementById('city-search-button') // Submit city search.
const metricButton = document.getElementById('metric-button') // Use metric units.
const usButton = document.getElementById('us-button') // Use US units.
const cityResults = document.getElementById('city-results')

// Elements whose contents change on a per-city basis:
const cityName = document.getElementById('city-name')
const cityTime = document.getElementById('city-time')
const conditionIcon = document.getElementById('condition-icon')
const conditionText = document.getElementById('condition-text')
const cityTemp = document.getElementById('city-tempreal')
const cityFeelslike = document.getElementById('city-tempfeel')
const statRow = document.getElementById('stat-row')

const weatherapi = {
    baseUrl: 'api.weatherapi.com/v1',
    key: '1bade1c92b76455c967183012242804'
}

const sunapi = {
    baseUrl: 'api.sunrise-sunset.org'
}

let canFetchWeatherFlag = false; // Used to avoid 400 error (error when fetching weather if no search results).
let metricFlag = true; // Metric or US?

cityInput.value = "" // Everything assumes this is true.
metricButton.disabled = true

// General function for constructing URLs for API endpoints.
function makeApiUrl(baseUrl, method, params) {
    // Construct the base URL with the API method
    let apiUrl = `https://${baseUrl}/${method}?`
  
    let param_i = 0;
    for (const param in params) {
        const value = params[param]
        if (param_i != 0) {
            apiUrl += '&'
        }
        apiUrl += `${param}=${value}`
        param_i++
    }
    return apiUrl
}

// Convert the timestamp returned by weatherapi into something 
// more user readable.
function convertTimestamp(isoTimestamp) {
    const date = new Date(isoTimestamp)
    const options = {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    }
    const locale = 'en-US'
    return new Intl.DateTimeFormat(locale, options).format(date)
}

// Fetch cities matching query.
async function fetchSearch(q) {
    const searchUrl = makeApiUrl(weatherapi.baseUrl, 'search.json', {q: q, key: weatherapi.key})
    const response = await fetch(searchUrl);
    const json = await response.json()
    if (json.length > 0) {
        canFetchWeatherFlag = true; // At least one city matches q.
    } else {
        canFetchWeatherFlag = false; // No cities match q.
    }
    const cities = json.map(({name, region, country}) => `${name}, ${region}, ${country}`)
    return cities
}

// Fetch weather for city that matches query.
async function fetchWeather(q) {
    const currentWeatherUrl = makeApiUrl(weatherapi.baseUrl, 'current.json', {q: q, key: weatherapi.key});
    const response = await fetch(currentWeatherUrl);
    const json = await response.json()
    return json
}

// Fetch sunset and sunrise information for given location.
async function fetchSun(lat, lon, tz_id) {
    // Parameter names are slightly different for sunapi. Sunapi requires no api key.
    const sunUrl = makeApiUrl(sunapi.baseUrl, 'json', {lat: lat, lng: lon, tzid: tz_id})
    const response = await fetch(sunUrl);
    const json = await response.json()
    return json
}

// Reload HTML datalist.
cityInput.addEventListener('input', async (ev) => {
    cityInput.style.border = ''
    const cityQuery = cityInput.value
    if (cityQuery != '') { // Search must have a non-empty query.
        cityList.innerHTML = ''
        const cities = await fetchSearch(cityQuery)
        for (const city of cities) {
            const option = document.createElement('option')
            option.value = city
            cityList.appendChild(option)
        }
    }
})

// Combine data from weatherapi and sunapi into one object.
function combineCurrentWeather(location, current, sunTimes, metricFlag) {
    const cityName = location['name']
    const cityRegion = location['region']
    const cityCountry = location['country']
    const name = `${cityName}, ${cityRegion}, ${cityCountry}`
    
    const common = {
        name: name,
        time: convertTimestamp(location['localtime']),
        condition_text: current['condition']['text'],
        condition_icon: current['condition']['icon'],
        wind_angle: `${current['wind_degree']}°`, // Used to draw angle arrow.
        sunrise: sunTimes['sunrise'],
        sunset: sunTimes['sunset']
    }

    if (metricFlag) {
        const metric = {
            temp: `${current['temp_c']} °C`,
            temp_feel: `${current['feelslike_c']} °C`,
            wind_speed: `${current['wind_kph']} kph`,
            precip: `${current['precip_mm']} mm`
        }
        return {...common, ...metric}
    }

    const us = {
        temp: `${current['temp_f']} °F`,
        temp_feel: `${current['feelslike_f']} °F`,
        wind_speed: `${current['wind_mph']} mph`,
        precip: `${current['precip_in']} in`
    }
    return {...common, ...us}
}

// Set current weather HTML elements.
function setCurrentWeather(currentWeather) {
    console.log(currentWeather)
    cityName.innerText = currentWeather.name
    cityTime.innerText = currentWeather.time
    conditionIcon.src = `http:${currentWeather.condition_icon}`
    conditionText.innerText = currentWeather.condition_text
    cityTemp.innerText = `Temperature: ${currentWeather.temp}`
    cityFeelslike.innerText = `Feels like: ${currentWeather.temp_feel}`
    statRow.innerHTML = `
        <td>${currentWeather.wind_speed}</td>
        <td>${currentWeather.wind_angle}</td>
        <td>${currentWeather.precip}</td>
        <td>${currentWeather.sunrise}</td>
        <td>${currentWeather.sunset}</td>
    `
}

// Reload weather results UI.
async function reloadWeather() {
    const cityQuery = cityInput.value
    if (canFetchWeatherFlag) {
        // Show cityResults section:
        cityResults.hidden = false

        // Fetch weather json:
        const weatherJson = await fetchWeather(cityQuery)

        // Show city name:
        const location = weatherJson['location']

        // Get lat, lon, tz_id for sunapi:
        const lat = location['lat']
        const lon = location['lon']
        const tz_id = location['tz_id']

        const sunJson = await fetchSun(lat, lon, tz_id)
        const sunTimes = sunJson['results']
        
        const current = weatherJson['current']

        // Data that is displayed in the UI:
        const currentWeather = combineCurrentWeather(location, current, sunTimes, metricFlag)

        // Set UI values to those in uiData:
        setCurrentWeather(currentWeather)
    } else {
        cityInput.style.border = "2px dotted red"
    }
}

citySearchButton.addEventListener('click', async (ev) => {
    await reloadWeather()
})

metricButton.addEventListener('click', async (ev) => {
    metricFlag = !metricFlag
    metricButton.disabled = true
    usButton.disabled = false
    await reloadWeather()
})

usButton.addEventListener('click', async (ev) => {
    metricFlag = !metricFlag
    usButton.disabled = true
    metricButton.disabled = false
    await reloadWeather()
})
