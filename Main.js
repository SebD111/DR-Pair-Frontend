const { createApp } = Vue;

createApp({
    data() {
        return {
            records: [],
            errorMessage: ''
        };
    },
    mounted() {
        this.fetchRecords();
    },
    methods: {
        fetchRecords() {
            this.errorMessage = '';
            axios.get('https://localhost:7297/api/records')
                .then(response => {
                    this.records = response.data;
                })
                .catch(error => {
                    console.error('Fejl ved hentning:', error);
                    this.errorMessage = 'Kunne ikke hente musikplader. Tjek at backend kører på https://localhost:7297.';
                });
        }
    }
}).mount('#app');