'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { authService } from '../../services/authService';

export default function ClientPage() {
    const router = useRouter();

    useEffect(() => {
        // Редиректим авторизованных пользователей на их страницы
        if (authService.isAuthenticated()) {
            const role = authService.getRole();
            
            if (role === 'ADMIN') {
                router.push('/admin/dashboard');
            } else if (role === 'OWNER') {
                router.push('/owner/cargo');
            } else if (role === 'CARRIER') {
                router.push('/carrier/requests');
            } else {
                router.push('/');
            }
        } else {
            router.push('/');
        }
    }, [router]);

    return <div>Перенаправление...</div>;
}
