// frontend/script.js

// Fetch services from backend
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

// Search services
function searchServices() {
    const query = document.getElementById("search").value.toLowerCase();
    fetchServices(); // This should be modified to filter based on query
}

// Load services on page load
document.addEventListener("DOMContentLoaded", fetchServices);
