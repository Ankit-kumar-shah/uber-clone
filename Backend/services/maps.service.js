const axios = require('axios');
const captainModel = require('../models/captain.model');

const API_KEY = 'AIzaSyCY1a3uJVVDS3KpErqptDSXYJl3hhOWDzA'
const BASE_URL = 'https://addressvalidation.gomaps.pro/v1:validateAddress';

/**
 * Get Address Coordinates using GoMaps API
 */
module.exports.getAddressCoordinate = async (address, regionCode = "IN") => {
    if (!address) {
        throw new Error('Address is required');
    }

    try {
        const response = await axios.post(`${`http://localhost:5173`}?key=${`AIzaSyCY1a3uJVVDS3KpErqptDSXYJl3hhOWDzA`}`, {
            address: { regionCode, addressLines: [address] }
        }, { headers: { 'Content-Type': 'application/json' } });

        if (response.data.result?.geocode?.location) {
            const location = response.data.result.geocode.location;
            return { lat: location.latitude, lng: location.longitude };
        } else {
            throw new Error('Unable to fetch coordinates');
        }
    } catch (error) {
        console.error('Error fetching address coordinates:', error?.response?.data || error.message);
        throw new Error('Failed to fetch address coordinates');
    }
};

/**
 * Get Distance between two locations using GoMaps API
 */
module.exports.getDistanceTime = async (origin, destination, regionCode = "IN") => {
    if (!origin || !destination) {
        throw new Error('Origin and destination are required');
    }

    try {
        // Get coordinates for origin
        const originCoords = await module.exports.getAddressCoordinate(origin, regionCode);
        // Get coordinates for destination
        const destinationCoords = await module.exports.getAddressCoordinate(destination, regionCode);

        // Calculate distance using Haversine formula
        const distance = calculateHaversineDistance(
            originCoords.lat, originCoords.lng,
            destinationCoords.lat, destinationCoords.lng
        );

        return {
            origin,
            destination,
            distanceKm: distance.toFixed(2) // Return distance in km with 2 decimal places
        };
    } catch (error) {
        console.error('Error calculating distance:', error?.response?.data || error.message);
        throw new Error('Failed to calculate distance');
    }
};

// Haversine formula to calculate distance between two coordinates
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const toRadians = (deg) => deg * (Math.PI / 180);

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in km
}

/**
 * Get Autocomplete Suggestions using GoMaps API
 */
module.exports.getAutoCompleteSuggestions = async (input, regionCode = "IN") => {
    if (!input) {
        throw new Error('Query is required');
    }

    try {
        const response = await axios.post(`${BASE_URL}?key=${API_KEY}`, {
            address: { regionCode, addressLines: [input] }
        }, { headers: { 'Content-Type': 'application/json' } });

        if (response.data.result?.address?.addressComponents) {
            return response.data.result.address.addressComponents.map(
                component => component.componentName.text
            );
        } else {
            throw new Error('Unable to fetch suggestions');
        }
    } catch (error) {
        console.error('Error fetching autocomplete suggestions:', error?.response?.data || error.message);
        throw new Error('Failed to fetch autocomplete suggestions');
    }
};

/**
 * Get Captains within a Radius (MongoDB Query)
 */
module.exports.getCaptainsInTheRadius = async (lat, lng, radius) => {
    try {
        const captains = await captainModel.aggregate([
            {
                $geoNear: {
                    near: { type: "Point", coordinates: [lng, lat] },
                    distanceField: "distance",
                    maxDistance: radius * 1000, // Convert km to meters
                    spherical: true
                }
            }
        ]);
        return captains;
    } catch (error) {
        console.error('Error fetching captains:', error.message);
        throw new Error('Failed to fetch captains within the given radius');
    }
};
