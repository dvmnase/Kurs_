'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/client/CargoSearch.module.sass';

interface Cargo {
    id: number;
    name: string;
    description?: string;
    weight?: number;
    location?: {
        address?: string;
        latitude?: number;
        longitude?: number;
    };
}

const CargoSearchPage = () => {
    const router = useRouter();
    const [cargos, setCargos] = useState<Cargo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');

    useEffect(() => {
        fetchCargos();
    }, [searchTerm, sortBy, sortOrder]);

    const fetchCargos = async () => {
        try {
            setLoading(true);
            setError(null);
            const params: any = {};
            if (searchTerm) params.search = searchTerm;
            if (sortBy) params.sortBy = sortBy;
            if (sortOrder) params.sortOrder = sortOrder;
            
            const response = await fetch(`http://localhost:8080/api/public/cargo?${new URLSearchParams(params)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка при загрузке грузов');
            }

            const data = await response.json();
            setCargos(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла ошибка');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Поиск грузов</h1>
                <p className={styles.subtitle}>Найдите подходящий груз для перевозки</p>
            </div>

            <div className={styles.searchSection}>
                <div className={styles.filters}>
                    <input
                        type="text"
                        placeholder="Поиск по названию или описанию..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className={styles.sortSelect}
                    >
                        <option value="name">По названию</option>
                        <option value="weight">По весу</option>
                    </select>
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className={styles.sortSelect}
                    >
                        <option value="asc">По возрастанию</option>
                        <option value="desc">По убыванию</option>
                    </select>
                </div>
            </div>

            {error && (
                <div className={styles.error}>
                    {error}
                </div>
            )}

            {loading ? (
                <div className={styles.loading}>Загрузка...</div>
            ) : (
                <div className={styles.cargosGrid}>
                    {cargos.length > 0 ? (
                        cargos.map((cargo) => (
                            <div key={cargo.id} className={styles.cargoCard}>
                                <h3 className={styles.cargoName}>{cargo.name}</h3>
                                {cargo.description && (
                                    <p className={styles.cargoDescription}>{cargo.description}</p>
                                )}
                                {cargo.weight && (
                                    <p className={styles.cargoWeight}>
                                        <strong>Вес:</strong> {cargo.weight} кг
                                    </p>
                                )}
                                {cargo.location?.address && (
                                    <p className={styles.cargoAddress}>
                                        <strong>Адрес:</strong> {cargo.location.address}
                                    </p>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className={styles.noResults}>
                            <p>Грузы не найдены. Попробуйте изменить параметры поиска.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CargoSearchPage;

