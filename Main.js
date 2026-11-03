const { createApp } = Vue;

createApp({
    data() {
        return {
            records: [],
            titleFilter: '',
            artistFilter: '',
            usernameInput: '',
            passwordInput: '',
            auth: {
                token: '',
                expiresAtUtc: '',
                username: '',
                role: ''
            },
            isLoading: false,
            isLoggingIn: false,
            errorMessage: '',
            loginError: ''
        };
    },

    mounted() {
        // Records er offentlige og hentes også, når brugeren ikke er logget ind.
        this.fetchRecords();
    },

    methods: {
        async login() {
            if (this.isLoggingIn) {
                return;
            }

            const username = this.usernameInput.trim();

            if (!username || !this.passwordInput) {
                this.loginError = 'Indtast både brugernavn og adgangskode.';
                return;
            }

            this.loginError = '';
            this.isLoggingIn = true;

            try {
                const response = await axios.post(
                    'https://localhost:7297/api/auth/login',
                    {
                        username,
                        password: this.passwordInput
                    });

                this.auth = {
                    token: response.data.token,
                    expiresAtUtc: response.data.expiresAtUtc,
                    username: response.data.username,
                    role: response.data.role
                };

                this.passwordInput = '';
            } catch (error) {
                console.error('Fejl ved login:', error);

                if (error.response?.status === 401) {
                    this.loginError =
                        error.response.data?.message ??
                        'Forkert brugernavn eller adgangskode.';
                } else if (error.response?.status === 400) {
                    this.loginError =
                        'Indtast både brugernavn og adgangskode.';
                } else {
                    this.loginError =
                        'Kunne ikke logge ind. Kontrollér, at backend kører på https://localhost:7297.';
                }
            } finally {
                this.isLoggingIn = false;
            }
        },

        async fetchRecords() {
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

            try {
                const response = await axios.get(
                    'https://localhost:7297/api/records',
                    { params });

                this.records = response.data;
            } catch (error) {
                console.error('Fejl ved hentning af musikplader:', error);
                this.records = [];
                this.errorMessage =
                    'Kunne ikke hente musikplader. Tjek at backend kører på https://localhost:7297.';
            } finally {
                this.isLoading = false;
            }
        },

        resetFilters() {
            if (this.isLoading) {
                return;
            }

            this.titleFilter = '';
            this.artistFilter = '';
            return this.fetchRecords();
        },

        logout() {
            // Der findes ikke et logout-endpoint; ryd kun klientens loginstatus.
            this.auth = {
                token: '',
                expiresAtUtc: '',
                username: '',
                role: ''
            };

            this.usernameInput = '';
            this.passwordInput = '';
            this.loginError = '';
        }
    }
}).mount('#app');