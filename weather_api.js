// Given a city name, show the day length circle chart (e.g. https://en.wikipedia.org/wiki/Twilight).
// Have a search bar.

// Fetching JSON data from an API endpoint in JavaScript in web browser.

/*
Free plan: 
- Forecast: 3 days with daily and hourly intervals.
- Historical: last 7 days are shown.
*/

/* E.g. Current weather in Paris, using convention of REST API query string parameters:
$ wget "$baseURL$apiMethod?q=$q&key=$key"
{"location":{"name":"Paris","region":"Ile-de-France","country":"France","lat":48.87,"lon":2.33,"tz_id":"Europe/Paris","localtime_epoch":1714331246,"localtime":"2024-04-28 21:07"},"current":{"last_updated_epoch":1714330800,"last_updated":"2024-04-28 21:00","temp_c":11.0,"temp_f":51.8,"is_day":0,"condition":{"text":"Light rain","icon":"//cdn.weatherapi.com/weather/64x64/night/296.png","code":1183},"wind_mph":5.6,"wind_kph":9.0,"wind_degree":260,"wind_dir":"W","pressure_mb":1015.0,"pressure_in":29.97,"precip_mm":0.0,"precip_in":0.0,"humidity":82,"cloud":0,"feelslike_c":8.8,"feelslike_f":47.8,"vis_km":10.0,"vis_miles":6.0,"uv":1.0,"gust_mph":17.3,"gust_kph":27.8}}
// Also, you can search it up in a modern web browser and it will display JSON.
*/

const cityResults = document.getElementById('city-results')
const citySearchButton = document.getElementById('city-search-button')
const cityInput = document.getElementById('city-input')
const cityResultsHeader = document.getElementById('city-results-header')
const dataHolder = document.getElementById('weather-json')
const cityList = document.getElementById('cities')

const weatherapi = {
    baseUrl: 'http://api.weatherapi.com/v1',
    key: '1bade1c92b76455c967183012242804'
}

const sunapi = {
    baseUrl: 'api.sunrise-sunset.org'
}

// q = 'Paris' // q is location for some reason
// method = 'current.json'
// const url = weatherapiURL(baseUrl, method, key, q)

function apiUrl(baseUrl, method, params) {
    // Construct the base URL with the API method
    let apiUrl = `${baseUrl}/${method}?`
  
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

async function fetchSearch(q) {
    const searchUrl = apiUrl(weatherapi.baseUrl, 'search.json', {q: q, key: weatherapi.key})
    const response = await fetch(searchUrl);
    const json = await response.json()
    const cities = json.map(({name, region, country}) => `${name}, ${region}, ${country}`)
    return cities
}

async function fetchWeather(q) {
    const currentWeatherUrl = apiUrl(weatherapi.baseUrl, 'current.json', {q: q, key: weatherapi.key});
    const response = await fetch(currentWeatherUrl);
    const json = await response.json()
    return json
}

async function updateResults(q) {
    if (q != '') {
        // Fetch weather json 
        const json = await fetchWeather(q)

        if (json['error']) {
            // City was not found based on q
            cityInput.style.border = "2px dotted red"
            return
        }

        // Show cityResults section
        cityResults.hidden = false
        dataHolder.textContent = JSON.stringify(json)

        // Show city name
        const cityName = json['location']['name']
        const cityRegion = json['location']['region']
        const cityCountry = json['location']['country']
        cityResultsHeader.innerText = `City Results: ${cityName}, ${cityRegion}, ${cityCountry}`
    }
}

async function updateSearch(q) {
    if (q != '') {
        cityList.innerHTML = ''
        const cities = await fetchSearch(q)
        for (const city of cities) {
            const option = document.createElement('option')
            option.value = city
            cityList.appendChild(option)
        }
    }
}

citySearchButton.addEventListener('click', async (ev) => {
    const cityQuery = cityInput.value
    await updateResults(cityQuery)
})

cityInput.addEventListener('input', async (ev) => {
    cityInput.style.border = ''
    const cityQuery = cityInput.value
    await updateSearch(cityQuery)
})
