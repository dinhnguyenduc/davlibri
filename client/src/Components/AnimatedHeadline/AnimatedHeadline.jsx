import { useEffect, useState } from 'react';
import './AnimatedHeadline.css';
import { requestGetHeadlines } from '../../config/request';

const AnimatedHeadline = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [headline, setHeadline] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHeadline = async () => {
            try {
                const response = await requestGetHeadlines();
                const headlineData = response.metadata;

                if (headlineData && headlineData.length > 0) {
                    // Lấy headline đầu tiên (có order nhỏ nhất)
                    setHeadline(headlineData[0]);
                } else {
                    // Fallback về nội dung mặc định
                    setHeadline({
                        plainText: 'Đọc được nhiều sách hơn và đọc tốt hơn với DAVLibri chỉ từ',
                        dynamicText: '1,900đ/ngày',
                        textColor: '#333333',
                        highlightColor: '#ff6b6b',
                    });
                }
                setLoading(false);
            } catch (error) {
                console.error('Error fetching headline:', error);
                // Fallback về nội dung mặc định nếu có lỗi
                setHeadline({
                    plainText: 'Đọc được nhiều sách hơn và đọc tốt hơn với DAVLibri chỉ từ',
                    dynamicText: '1,900đ/ngày',
                    textColor: '#333333',
                    highlightColor: '#ff6b6b',
                });
                setLoading(false);
            }
        };

        fetchHeadline();
    }, []);

    useEffect(() => {
        // Trigger animation after component mounts
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 300);
        return () => clearTimeout(timer);
    }, []);

    if (loading || !headline) {
        return null;
    }

    return (
        <div className="animated-headline-container">
            <div className="animated-headline-wrapper">
                <h2 className="animated-headline">
                    <span className="headline-plain-text" style={{ color: headline.textColor }}>
                        {headline.plainText}
                    </span>
                    <span className={`headline-dynamic-wrapper ${isVisible ? 'active' : ''}`}>
                        <span className="headline-dynamic-text" style={{ color: headline.highlightColor }}>
                            {headline.dynamicText}
                        </span>
                        <svg
                            className="headline-highlight-circle"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 500 150"
                            preserveAspectRatio="none"
                            style={{ stroke: headline.highlightColor }}
                        >
                            <path d="M325,18C228.7-8.3,118.5,8.3,78,21C22.4,38.4,4.6,54.6,5.6,77.6c1.4,32.4,52.2,54,142.6,63.7 c66.2,7.1,212.2,7.5,273.5-8.3c64.4-16.6,104.3-57.6,33.8-98.2C386.7-4.9,179.4-1.4,126.3,20.7"></path>
                        </svg>
                    </span>
                </h2>
            </div>
        </div>
    );
};

export default AnimatedHeadline;
