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
            newRecord: {
                title: '',
                artist: '',
                duration: null,
                publicationYear: new Date().getUTCFullYear()
            },
            isLoading: false,
            isLoggingIn: false,
            isCreating: false,
            errorMessage: '',
            loginError: '',
            recordError: '',
            recordSuccess: ''
        };
    },

    computed: {
        currentYear() {
            return new Date().getUTCFullYear();
        }
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

        async createRecord() {
            if (this.isCreating) {
                return;
            }

            this.recordError = '';
            this.recordSuccess = '';

            const title = this.newRecord.title.trim();
            const artist = this.newRecord.artist.trim();
            const duration = this.newRecord.duration;
            const publicationYear = this.newRecord.publicationYear;

            if (!title || !artist) {
                this.recordError = 'Titel og kunstner skal indeholde tekst.';
                return;
            }

            if (!Number.isInteger(duration) || duration < 1) {
                this.recordError =
                    'Varighed skal være et helt tal på mindst 1 sekund.';
                return;
            }

            if (!Number.isInteger(publicationYear) ||
                publicationYear < 1 ||
                publicationYear > this.currentYear) {
                this.recordError =
                    `Udgivelsesår skal være mellem 1 og ${this.currentYear}.`;
                return;
            }

            this.isCreating = true;

            try {
                const response = await axios.post(
                    'https://localhost:7297/api/records',
                    {
                        title,
                        artist,
                        duration,
                        publicationYear
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${this.auth.token}`
                        }
                    });

                this.recordSuccess =
                    `Musikpladen "${response.data.title}" blev oprettet.`;

                this.newRecord = {
                    title: '',
                    artist: '',
                    duration: null,
                    publicationYear: this.currentYear
                };

                // Nulstil filtre, så den nye plade vises i listen.
                this.titleFilter = '';
                this.artistFilter = '';

                // Vent på en igangværende hentning, før listen opdateres.
                while (this.isLoading) {
                    await new Promise(resolve => setTimeout(resolve, 25));
                }

                await this.fetchRecords();
            } catch (error) {
                console.error('Fejl ved oprettelse af musikplade:', error);

                const status = error.response?.status;

                if (status === 400) {
                    const errors = error.response.data?.errors;

                    this.recordError = errors
                        ? Object.values(errors).flat().join(' ')
                        : error.response.data?.title ??
                          'Kontrollér oplysningerne, og prøv igen.';
                } else if (status === 401) {
                    this.auth = {
                        token: '',
                        expiresAtUtc: '',
                        username: '',
                        role: ''
                    };

                    this.loginError =
                        'Dit login er udløbet eller ugyldigt. Log ind igen.';
                    this.recordError = this.loginError;
                } else if (status === 403) {
                    this.recordError =
                        'Du skal være administrator for at oprette musikplader.';
                } else {
                    this.recordError =
                        'Musikpladen kunne ikke oprettes. Kontrollér, at backend kører på https://localhost:7297.';
                }
            } finally {
                this.isCreating = false;
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