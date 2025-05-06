import React from 'react';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { authService } from '../services/authService';

const DashboardPage: React.FC = () => {
    const handleLogout = () => {
        authService.logout();
        window.location.href = '/admin/dashboard';
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-100">
                <nav className="bg-white shadow-lg">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex justify-between h-16">
                            <div className="flex items-center">
                                <h1 className="text-xl font-bold">Панель управления</h1>
                            </div>
                            <div className="flex items-center">
                                <button
                                    onClick={handleLogout}
                                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    Выйти
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>

                <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="px-4 py-6 sm:px-0">
                        <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-4">
                            <h2 className="text-2xl font-bold mb-4">Добро пожаловать!</h2>
                            <p>Вы вошли в систему как: {authService.getRole()}</p>
                        </div>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
};

export default DashboardPage; 