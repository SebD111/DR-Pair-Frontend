const { createApp } = Vue;

createApp({
    data() {
        return {
            records: [],
            titleFilter: '',
            artistFilter: '',
            isLoading: false,
            errorMessage: ''
        };
    },
    mounted() {
        this.fetchRecords();
    },
    methods: {
        fetchRecords() {
            if (this.isLoading) {
                return;
            }

            const params = {};
            const title = this.titleFilter.trim();
            const artist = this.artistFilter.trim();
            if (title) {
                params.title = title;
            }
            if (artist) {
                params.artist = artist;
            }

            this.errorMessage = '';
            this.isLoading = true;
            return axios.get('https://localhost:7297/api/records', { params })
                .then(response => {
                    this.records = response.data;
                })
                .catch(error => {
                    console.error('Fejl ved hentning:', error);
                    this.records = [];
                    this.errorMessage = 'Kunne ikke hente musikplader. Tjek at backend kører på https://localhost:7297.';
                })
                .finally(() => {
                    this.isLoading = false;
                });
        },
        resetFilters() {
            if (this.isLoading) {
                return;
            }

            this.titleFilter = '';
            this.artistFilter = '';
            return this.fetchRecords();
        }
    }
}).mount('#app');