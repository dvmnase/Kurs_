declare global {
    interface Window {
        ymaps: any;
        yandexMapsLoading: Promise<any> | null;
    }
}

const YANDEX_MAPS_API_KEY = '70d701ca-5be5-40b4-9518-15fd4b80f208';

// Загрузка Яндекс Карт API 2.1
export const loadYandexMaps = async (): Promise<any> => {
    // Если API уже загружен
    if (window.ymaps && window.ymaps.ready) {
        return new Promise((resolve) => {
            window.ymaps.ready(() => {
                resolve(window.ymaps);
            });
        });
    }

    // Если уже идет загрузка, возвращаем существующий промис
    if (window.yandexMapsLoading) {
        return window.yandexMapsLoading;
    }

    // Загружаем API 2.1
    window.yandexMapsLoading = loadYandexMapsV2();

    return window.yandexMapsLoading;
};

// Загрузка API 2.1
const loadYandexMapsV2 = (): Promise<any> => {
    return new Promise((resolve, reject) => {
        // Проверяем, не загружается ли уже скрипт
        const existingScript = document.querySelector(`script#yandex-maps-script`) as HTMLScriptElement;
        if (existingScript) {
            if (window.ymaps && window.ymaps.ready) {
                window.ymaps.ready(() => {
                    window.yandexMapsLoading = null;
                    resolve(window.ymaps);
                });
            } else {
                const checkYmaps = setInterval(() => {
                    if (window.ymaps && window.ymaps.ready) {
                        clearInterval(checkYmaps);
                        window.ymaps.ready(() => {
                            window.yandexMapsLoading = null;
                            resolve(window.ymaps);
                        });
                    }
                }, 100);

                setTimeout(() => {
                    clearInterval(checkYmaps);
                    window.yandexMapsLoading = null;
                    reject(new Error('Yandex Maps API 2.1 failed to initialize'));
                }, 10000);
            }
            return;
        }

        // Создаем и загружаем скрипт для Яндекс Карт API 2.1
        const script = document.createElement('script');
        script.src = `https://api-maps.yandex.ru/2.1/?apikey=${YANDEX_MAPS_API_KEY}&lang=ru_RU`;
        script.async = true;
        script.type = 'text/javascript';
        script.id = 'yandex-maps-script';
        
        script.onload = () => {
            console.log('Yandex Maps API 2.1 script loaded successfully');
            let attempts = 0;
            const maxAttempts = 100;
            
            const checkYmaps = setInterval(() => {
                attempts++;
                if (window.ymaps && window.ymaps.ready) {
                    clearInterval(checkYmaps);
                    console.log('Yandex Maps API 2.1 initialized');
                    window.ymaps.ready(() => {
                        window.yandexMapsLoading = null;
                        resolve(window.ymaps);
                    });
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkYmaps);
                    window.yandexMapsLoading = null;
                    reject(new Error('Yandex Maps API 2.1 not available after script load'));
                }
            }, 50);
        };

        script.onerror = (error) => {
            window.yandexMapsLoading = null;
            const errorMsg = 'Failed to load Yandex Maps API 2.1 script';
            console.error(errorMsg, error);
            reject(new Error(errorMsg));
        };

        document.head.appendChild(script);
    });
};

