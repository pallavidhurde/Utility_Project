
async function fetchServices() {
    const response = await fetch("http://localhost:5000/api/services");
    const services = await response.json();
    const serviceList = document.getElementById("service-list");
    serviceList.innerHTML = "";
    services.forEach(service => {
        const li = document.createElement("li");
        li.textContent = `${service.name} - ${service.category}`;
        serviceList.appendChild(li);
    });
}

function searchServices() {
    const query = document.getElementById("search").value.toLowerCase();
    fetchServices(); 
}

document.addEventListener("DOMContentLoaded", fetchServices);
