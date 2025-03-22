import React, { useEffect, useRef, useState, useContext } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import axios from 'axios';
import 'remixicon/fonts/remixicon.css';
import LocationSearchPanel from '../components/LocationSearchPanel';
import VehiclePanel from '../components/VehiclePanel';
import ConfirmRide from '../components/ConfirmRide';
import LookingForDriver from '../components/LookingForDriver';
import WaitingForDriver from '../components/WaitingForDriver';
import { SocketContext } from '../context/SocketContext';
import { UserDataContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import LiveTracking from '../components/LiveTracking';

const BASE_URL = 'http://localhost:8000';

const Home = () => {
    const [pickup, setPickup] = useState('');
    const [destination, setDestination] = useState('');
    const [pickupSuggestions, setPickupSuggestions] = useState([]);
    const [destinationSuggestions, setDestinationSuggestions] = useState([]);
    const [fare, setFare] = useState({});
    const [vehicleType, setVehicleType] = useState(null);
    const [ride, setRide] = useState(null);
    
    const navigate = useNavigate();
    const { socket } = useContext(SocketContext);
    const { user } = useContext(UserDataContext);

    useEffect(() => {
        socket.emit("join", { userType: "user", userId: user._id });
    }, [user]);

    socket.on('ride-confirmed', ride => {
        setRide(ride);
    });

    socket.on('ride-started', ride => {
        navigate('/riding', { state: { ride } });
    });

    const handlePickupChange = async (e) => {
        setPickup(e.target.value);
        try {
            const response = await axios.get(`${BASE_URL}/maps/get-suggestions`, {
                params: { input: e.target.value },
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setPickupSuggestions(response.data);
        } catch (error) {
            console.error('Error fetching pickup suggestions', error);
        }
    };

    const handleDestinationChange = async (e) => {
        setDestination(e.target.value);
        try {
            const response = await axios.get(`${BASE_URL}/maps/get-suggestions`, {
                params: { input: e.target.value },
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setDestinationSuggestions(response.data);
        } catch (error) {
            console.error('Error fetching destination suggestions', error);
        }
    };

    async function findTrip() {
        try {
            const response = await axios.get(`${BASE_URL}/get-distance-time`, {
                params: { origin: pickup, destination },
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setFare(response.data);
        } catch (error) {
            console.error('Error fetching fare', error);
        }
    }

    async function createRide() {
        try {
            const response = await axios.post(`${BASE_URL}/rides/create`, {
                pickup,
                destination,
                vehicleType
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setRide(response.data);
        } catch (error) {
            console.error('Error creating ride', error);
        }
    }

    return (
        <div className='h-screen relative overflow-hidden'>
            <img className='w-16 absolute left-5 top-5' src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png" alt="Uber Logo" />
            <LiveTracking />
            <div className='absolute bottom-0 w-full bg-white p-6'>
                <h4 className='text-2xl font-semibold'>Find a trip</h4>
                <form onSubmit={(e) => e.preventDefault()}>
                    <input onChange={handlePickupChange} value={pickup} className='bg-gray-200 px-4 py-2 w-full rounded-lg' placeholder='Pickup location' />
                    <input onChange={handleDestinationChange} value={destination} className='bg-gray-200 px-4 py-2 w-full mt-3 rounded-lg' placeholder='Destination' />
                </form>
                <button onClick={findTrip} className='bg-black text-white w-full mt-3 py-2 rounded-lg'>Find Trip</button>
            </div>
            <VehiclePanel selectVehicle={setVehicleType} fare={fare} />
            <ConfirmRide createRide={createRide} pickup={pickup} destination={destination} fare={fare} vehicleType={vehicleType} />
        </div>
    );
};

export default Home;
