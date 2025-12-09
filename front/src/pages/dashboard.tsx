import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { authService } from '../services/authService';

const Dashboard = () => {
    const router = useRouter();

    useEffect(() => {
        const role = authService.getRole();
        
        if (!authService.isAuthenticated()) {
            router.push('/');
            return;
        }

        // Redirect based on role
        switch (role) {
            case 'ADMIN':
                router.push('/admin/dashboard');
                break;
            case 'OWNER':
                router.push('/owner/cargo');
                break;
            case 'CARRIER':
                router.push('/carrier/requests');
                break;
            default:
                router.push('/');
        }
    }, [router]);

    return <div>Redirecting...</div>;
};

export default Dashboard;
