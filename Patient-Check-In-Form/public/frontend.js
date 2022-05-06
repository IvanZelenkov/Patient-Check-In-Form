import Vue from 'https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.esm.browser.js'


Vue.component('loader', {
    template: `
    <div style="display: flex; justify-content: center; align-items: center">
      <div class="spinner-border" role="status">
        <span class="sr-only"></span>
      </div>
    </div>
  `
});

new Vue({
    el: '#app', // index.html
    data() {
        return {
            loading: false, // loading icon false
            form: {
                patientID: '',
                name: '',
                date: '',
                phoneNumber: ''
            },
            patients: []
        }
    },
    // computed properties enable us to create a properties that can be used to modify, 
    // manipulate, and display data within the components in a readable and efficient manner
    // Here, trim() is used
    computed: {
        canCreate() {
            return this.form.patientID.trim()
                && this.form.name.trim()
                && this.form.date.trim()
                && this.form.phoneNumber.trim();
        }
    },
    methods: {
        async createPatient() {
            const {...patient} = this.form;

            const newPatients = await request('/api/patients', 'POST', patient);

            this.patients.push(newPatients);

            // reset attributes
            this.form.patientID = this.form.value = '';
            this.form.name = this.form.value = '';
            this.form.date = this.form.value = '';
            this.form.phoneNumber = this.form.value = '';
        },
        // DELETE
        async removePatient(id) {
            await request(`/api/patients/${id}`, 'DELETE');
            this.patients = this.patients.filter(c => c.id !== id);
        }
    },
    // Vue calls the mounted() hook when component loader is added to the DOM. 
    // It is most often used to send an HTTP request to fetch data that the 
    // component will then render.
    async mounted() {
        this.loading = true;
        this.patients = await request('/api/patients');
        this.loading = false;
    }
})

async function request(url, method = 'GET', data = null) {
    try {
        const headers = {};
        let body;

        if (data) {
            // sending JSON to the server or receiving JSON from the server, 
            // we should always declare the Content-Type of the header as 
            // application/JSON as this is the standard that the client and server understand
            headers['Content-Type'] = 'application/json';
            body = JSON.stringify(data); // converts JavaScript data to a JSON-formatted string
        }

        const response = await fetch(url, {
            method,
            headers,
            body
        });
        return await response.json();
    } catch (error) {
        console.warn('Error: ', error.message);
    }
}