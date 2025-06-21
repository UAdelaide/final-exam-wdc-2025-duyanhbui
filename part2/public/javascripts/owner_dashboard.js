   const { createApp, ref, onMounted } = Vue;


    createApp({
      setup() {

        const form = ref({
          dog_id: '',
          requested_time: '',
          duration_minutes: '',
          location: ''
        });


        const walks = ref([]);
        const userDogs = ref([]);
        const message = ref('');
        const error = ref('');
        const user = JSON.parse(sessionStorage.getItem('user'));

        async function loadUserDogs() {
          try {
            const res = await fetch(`/api/users/${user.user_id}/dogs`);
            if (!res.ok) throw new Error('Failed to load dogs');
            userDogs.value = await res.json();
          } catch (err) {
            error.value = 'Failed to load dogs';
            console.error(err);
          }

        }


        async function loadWalks() {
          try {
            const res = await fetch(`/api/walks/owner/${user.user_id}`);
            walks.value = await res.json();
          } catch (err) {
            error.value = 'Failed to load walk requests';

          }
        }

        async function submitWalkRequest() {
          try {

            const res = await fetch('/api/walks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(form.value)
            });

            const result = await res.json();

            if (!res.ok) throw new Error(result.error || 'Error submitting walk request');

            message.value = result.message;
            error.value = '';
            form.value = {
              dog_id: '',
              requested_time: '',
              duration_minutes: '',
              location: ''
            };
            loadWalks();
          } catch (err) {
            error.value = err.message;
            message.value = '';
          }
        }


        function logout() {
          sessionStorage.removeItem('user');
          window.location.href = '/';
        }


        onMounted(() => {
          if (!user || user.role !== 'owner') {
            window.location.href = '/';
            return;
          }

          loadUserDogs();
          loadWalks();
        });

        return {
          form,
          walks,
          userDogs,
          message,
          error,
          submitWalkRequest,
          logout

        };

      }

    }).mount('#app');
