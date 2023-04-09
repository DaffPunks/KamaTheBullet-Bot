import axios from 'axios';

const requests = {
    random: {
        url: () => 'https://api.cleanvoice.ru/myinstants/?type=single',
        method: 'GET',
    },
    search: {
        url: ({query: {search}}) =>
            'https://api.cleanvoice.ru/myinstants/?type=many&search=' +
            encodeURI(search) +
            '&offset=0&limit=15',
        method: 'GET',
    },
};

const generateRequestsAPI = () => {
    const generatedRequests = {};

    Object.keys(requests).forEach((key) => {
        const {url, ...requestConfig} = requests[key];
        generatedRequests[key] = (data) => {
            const generatedUrl = url(data);

            return axios.request({
                url: generatedUrl,
                ...requestConfig,
                ...data,
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        };
    });

    return generatedRequests;
};

export default generateRequestsAPI();
