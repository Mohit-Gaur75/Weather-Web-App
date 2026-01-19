const button = document.getElementById("search-button");
const input = document.getElementById("city-input");
const cityName = document.getElementById("city-name");
const cityTime = document.getElementById("city-time");
const cityTemp = document.getElementById("city-temp");

async function getData(city) {
  try {
    const response = await fetch(
      `http://api.weatherapi.com/v1/current.json?key=087acaeaaebc46048e153115261601&q=${city}&aqi=yes`
    );

    if (!response.ok) {
      throw new Error("City not found");
    }

    return await response.json();
  } catch (error) {
    alert(error.message);
    return null;
  }
}
async function searchWeather() {
  const value = input.value.trim();

  if (value === "") {
    alert("Please enter a city name");
    return;
  }

  const result = await getData(value);
  if (!result) return;

  cityName.innerText = `${result.location.name}, ${result.location.region}, ${result.location.country}`;
  cityTime.innerText = `Local Time: ${result.location.localtime}`;
  cityTemp.innerText = `${result.current.temp_c} °C`;
}


button.addEventListener("click", searchWeather);


input.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    searchWeather();
  }
});