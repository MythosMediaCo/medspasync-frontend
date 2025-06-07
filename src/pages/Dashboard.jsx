import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Ui/Modal.jsx';
import { useAuth } from '../services/AuthContext.js';
import { formatCurrency, formatTime, generateInitials } from '../utils/formatting.js';

const DashboardPage = React.memo(() => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [activeTab, setActiveTab] = useState('overview');
    const [notifications] = useState(3);
    const [showModal, setShowModal] = useState(false);
    const [modalConfig, setModalConfig] = useState({});

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const stats = useMemo(() => ({
        totalRevenue: 45620,
        appointmentsToday: 12,
        activeClients: 247,
        monthlyGrowth: 15.8,
        completedToday: 6,
        remainingToday: 6
    }), []);

    const recentAppointments = useMemo(() => [
        { id: 1, client: 'Sarah Johnson', service: 'Botox Treatment', time: '10:30 AM', status: 'confirmed' },
        { id: 2, client: 'Michael Chen', service: 'Laser Hair Removal', time: '11:15 AM', status: 'in-progress' },
        { id: 3, client: 'Emma Williams', service: 'Chemical Peel', time: '2:00 PM', status: 'pending' },
        { id: 4, client: 'David Brown', service: 'Facial Treatment', time: '3:30 PM', status: 'confirmed' }
    ], []);

    const topServices = useMemo(() => [
        { service: 'Botox', revenue: 12400, sessions: 45, trend: '+12%' },
        { service: 'Fillers', revenue: 8900, sessions: 32, trend: '+8%' },
        { service: 'Laser Hair Removal', revenue: 7600, sessions: 28, trend: '+15%' },
        { service: 'Chemical Peels', revenue: 5200, sessions: 24, trend: '+5%' }
    ], []);

    const getStatusBadge = useCallback((status) => {
        const styles = {
            confirmed: 'bg-green-100 text-green-800 border-green-200',
            'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            completed: 'bg-gray-100 text-gray-800 border-gray-200',
            cancelled: 'bg-red-100 text-red-800 border-red-200'
        };

        return (
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${styles[status] || styles.pending}`}>
                {status.toUpperCase()}
            </span>
        );
    }, []);

    const handleLogoutClick = useCallback(() => {
        setModalConfig({
            title: 'Confirm Logout',
            children: <p className="text-gray-600 text-sm text-center">Are you sure you want to sign out of MedSpaSync Pro?</p>,
            confirmText: 'Yes, Sign Out',
            cancelText: 'No, Keep Me Logged In',
            onConfirm: () => {
                logout();
                setShowModal(false);
            },
            onClose: () => setShowModal(false),
            type: 'confirm',
            size: 'sm'
        });
        setShowModal(true);
    }, [logout]);

    const handleSettingsClick = useCallback(() => {
        setModalConfig({
            title: 'Settings Module',
            children: <p className="text-gray-600 text-sm text-center">Manage your profile, spa details, and preferences here. This module is coming soon!</p>,
            onClose: () => setShowModal(false),
            showCloseButton: true,
            closeOnOverlayClick: true,
            type: 'alert',
            size: 'sm'
        });
        setShowModal(true);
    }, []);

    const handleNotificationsClick = useCallback(() => {
        setModalConfig({
            title: 'Notifications Center',
            children: <p className="text-gray-600 text-sm text-center">You have new messages and appointment updates! This feature will provide a detailed notification center, coming soon.</p>,
            onClose: () => setShowModal(false),
            showCloseButton: true,
            closeOnOverlayClick: true,
            type: 'alert',
            size: 'sm'
        });
        setShowModal(true);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <div className="h-10 w-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                <span className="text-white font-bold text-lg">M</span>
                            </div>
                            <h1 className="ml-3 text-xl font-bold text-gray-900">MedSpaSync Pro</h1>
                        </div>

                        <div className="flex items-center space-x-6">
                            <div className="hidden sm:flex items-center space-x-4">
                                <div className="text-sm text-gray-600 font-medium">
                                    🕐 {formatTime(currentTime)}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Welcome back, <span className="font-medium text-gray-900">{user?.firstName || 'User'}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleNotificationsClick}
                                className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                title="Notifications"
                                aria-label="Notifications"
                            >
                                <span className="text-xl" role="img" aria-label="Bell icon">🔔</span>
                                {notifications > 0 && (
                                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                                        {notifications}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={handleSettingsClick}
                                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                title="Settings"
                                aria-label="Settings"
                            >
                                <span className="text-xl" role="img" aria-label="Settings icon">⚙️</span>
                            </button>

                            <button
                                onClick={handleLogoutClick}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                title="Sign Out"
                                aria-label="Sign Out"
                            >
                                <span className="text-xl" role="img" aria-label="Door icon">🚪</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-8 overflow-x-auto">
                        {[
                            { id: 'overview', label: 'Overview', icon: '📊' },
                            { id: 'appointments', label: 'Appointments', icon: '📅' },
                            { id: 'clients', label: 'Clients', icon: '👥' },
                            { id: 'payments', label: 'Payments', icon: '💳' },
                            { id: 'analytics', label: 'Analytics', icon: '📈' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                                aria-current={activeTab === tab.id ? 'page' : undefined}
                            >
                                <span role="img" aria-label={tab.label + " icon"}>{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-3xl font-bold mb-2">
                                        Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.firstName}!
                                    </h2>
                                    <p className="text-indigo-100 text-lg">
                                        Welcome to your {user?.spaName || 'medical spa'} dashboard
                                    </p>
                                </div>
                                <div className="text-6xl opacity-20" role="img" aria-label="Spa icon">
                                    💆‍♀️
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                                        <p className="text-sm text-green-600 flex items-center">
                                            <span className="mr-1" role="img" aria-label="Chart showing growth">📈</span>
                                            +{stats.monthlyGrowth}% this month
                                        </p>
                                    </div>
                                    <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                                        <span className="text-2xl" role="img" aria-label="Money bag">💰</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.appointmentsToday}</p>
                                        <p className="text-sm text-blue-600">
                                            {stats.completedToday} completed, {stats.remainingToday} remaining
                                        </p>
                                    </div>
                                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <span className="text-2xl" role="img" aria-label="Calendar">📅</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Active Clients</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.activeClients}</p>
                                        <p className="text-sm text-purple-600">+23 new this month</p>
                                    </div>
                                    <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <span className="text-2xl" role="img" aria-label="Users">👥</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.monthlyGrowth}%</p>
                                        <p className="text-sm text-orange-600">Above target <span role="img" aria-label="Target">🎯</span></p>
                                    </div>
                                    <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                        <span className="text-2xl" role="img" aria-label="Chart showing growth">📈</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                                <div className="p-6 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                            <span className="mr-2" role="img" aria-label="Clipboard">📋</span>
                                            Today's Schedule
                                        </h3>
                                        <button
                                            onClick={() => setActiveTab('appointments')}
                                            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors"
                                        >
                                            View All →
                                        </button>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4">
                                        {recentAppointments.map((apt) => (
                                            <div key={apt.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                                                        {generateInitials(apt.client.split(' ')[0], apt.client.split(' ')[1])}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{apt.client}</p>
                                                        <p className="text-sm text-gray-600">{apt.service}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium text-gray-900">{apt.time}</p>
                                                    {getStatusBadge(apt.status)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                                <div className="p-6 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                        <span className="mr-2" role="img" aria-label="Trophy">🏆</span>
                                        Top Services
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4">
                                        {topServices.map((service, index) => (
                                            <div key={index} className="flex items-center justify-between hover:bg-gray-50 p-3 rounded-lg transition-colors">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                                                        <span className="text-sm font-bold text-indigo-600">#{index + 1}</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{service.service}</p>
                                                        <p className="text-sm text-gray-600">{service.sessions} sessions</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium text-gray-900">{formatCurrency(service.revenue)}</p>
                                                    <p className="text-sm text-green-600">{service.trend}</p>
                                                    <div className="w-20 h-2 bg-gray-200 rounded-full mt-1">
                                                        <div
                                                            className="h-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all"
                                                            style={{ width: `${(service.revenue / 12400) * 100}%` }}
                                                            aria-label={`Revenue progress for ${service.service}`}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <div className="mb-6">
                        <span className="text-6xl" role="img" aria-label="Construction cones">🚧</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Module
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                        The complete {activeTab} management system with advanced features like scheduling,
                        client CRM, payment processing, and detailed analytics is coming in the next update.
                    </p>
                    <p className="text-sm text-gray-500 mb-8">
                        This demo shows the authentication flow and main dashboard structure.
                    </p>
                    <button
                        onClick={() => setActiveTab('overview')}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                    >
                        Back to Overview
                    </button>
                </div>
            </main>

            <div className="fixed bottom-6 right-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg">
                <div className="flex items-center space-x-2">
                    <span role="img" aria-label="Checkmark">✅</span>
                    <span className="text-sm font-medium">Enhanced Dashboard Ready!</span>
                </div>
            </div>
            <Modal isOpen={showModal} {...modalConfig} />
        </div>
    );
});

export default DashboardPage;