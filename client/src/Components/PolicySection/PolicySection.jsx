import { useEffect, useState } from 'react';
import { Gift, Truck, Tag, RefreshCw } from 'lucide-react';
import './PolicySection.css';
import { requestGetPolicies } from '../../config/request';

const PolicySection = () => {
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPolicies = async () => {
            try {
                const response = await requestGetPolicies();
                const policyData = response.metadata;

                if (policyData && policyData.length > 0) {
                    setPolicies(policyData);
                } else {
                    // Fallback data
                    setPolicies([
                        {
                            id: 1,
                            title: 'Quà tặng hấp dẫn',
                            description: 'Khuyến mãi lên đến 40% và nhiều quà tặng hấp dẫn',
                            icon: 'https://cdn-icons-png.flaticon.com/512/3176/3176366.png',
                            link: '#',
                            iconColor: '#ff6b6b',
                        },
                        {
                            id: 2,
                            title: 'Miễn phí vận chuyển',
                            description: 'Miễn phí vận chuyển toàn quốc với đơn hàng từ 300k',
                            icon: 'https://cdn-icons-png.flaticon.com/512/2769/2769339.png',
                            link: '#',
                            iconColor: '#4ecdc4',
                        },
                        {
                            id: 3,
                            title: 'Giá ưu đãi nhất',
                            description: 'Nhiều chương trình khuyến mãi hấp dẫn',
                            icon: 'https://cdn-icons-png.flaticon.com/512/3176/3176336.png',
                            link: '#',
                            iconColor: '#ffa502',
                        },
                        {
                            id: 4,
                            title: 'Đổi trả dễ dàng',
                            description: 'Hỗ trợ đổi hàng trong vòng 7 ngày kể từ khi nhận được sách',
                            icon: 'https://cdn-icons-png.flaticon.com/512/3176/3176384.png',
                            link: '#',
                            iconColor: '#5f27cd',
                        },
                    ]);
                }
                setLoading(false);
            } catch (error) {
                console.error('Error fetching policies:', error);
                // Use fallback data
                setPolicies([
                    {
                        id: 1,
                        title: 'Quà tặng hấp dẫn',
                        description: 'Khuyến mãi lên đến 40% và nhiều quà tặng hấp dẫn',
                        icon: 'https://cdn-icons-png.flaticon.com/512/3176/3176366.png',
                        link: '#',
                        iconColor: '#ff6b6b',
                    },
                    {
                        id: 2,
                        title: 'Miễn phí vận chuyển',
                        description: 'Miễn phí vận chuyển toàn quốc với đơn hàng từ 300k',
                        icon: 'https://cdn-icons-png.flaticon.com/512/2769/2769339.png',
                        link: '#',
                        iconColor: '#4ecdc4',
                    },
                    {
                        id: 3,
                        title: 'Giá ưu đãi nhất',
                        description: 'Nhiều chương trình khuyến mãi hấp dẫn',
                        icon: 'https://cdn-icons-png.flaticon.com/512/3176/3176336.png',
                        link: '#',
                        iconColor: '#ffa502',
                    },
                    {
                        id: 4,
                        title: 'Đổi trả dễ dàng',
                        description: 'Hỗ trợ đổi hàng trong vòng 7 ngày kể từ khi nhận được sách',
                        icon: 'https://cdn-icons-png.flaticon.com/512/3176/3176384.png',
                        link: '#',
                        iconColor: '#5f27cd',
                    },
                ]);
                setLoading(false);
            }
        };

        fetchPolicies();
    }, []);

    if (loading) {
        return null;
    }

    return (
        <section className="policy-section">
            <div className="policy-container">
                <div className="policy-row">
                    {policies.map((policy) => (
                        <div key={policy._id || policy.id} className="policy-item">
                            <div className="policy-icon" style={{ backgroundColor: policy.iconColor }}>
                                <img src={policy.icon} alt={policy.title} />
                            </div>
                            <div className="policy-info">
                                <h4>
                                    <a href={policy.link}>{policy.title}</a>
                                </h4>
                                <p>{policy.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PolicySection;
