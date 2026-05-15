import { useEffect } from 'react';
import { useRouter } from 'next/router';

const ServiceViewPage = () => {
    const router = useRouter();

    useEffect(() => {
        router.replace('/client/services');
    }, [router]);

    return null;
};

export default ServiceViewPage;
