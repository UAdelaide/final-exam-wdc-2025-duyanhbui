const { createApp, ref, onMounted } = Vue;

createApp({

    setup() {
    const walks = ref([]);
    const message = ref('');
    const error = ref('');
    let user = JSON.parse(sessionStorage.getItem('user'));
    const currentUser = ref(null);

    async function getCurrentUser() {
        // First try to get from sessionStorage
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
            return JSON.parse(storedUser);
        }

        // If not in sessionStorage, try to fetch from server
        try {
            const response = await fetch('/api/users/me');
            if (!response.ok) throw new Error('Not logged in');
            user = await response.json();


            // Store in sessionStorage for future use
            sessionStorage.setItem('user', JSON.stringify(user));
            return user;
        } catch (err) {
            return null;
        }

    }

    async function loadWalkRequests() {

        try {
        const res = await fetch('/api/walks');
        if (!res.ok) throw new Error('Failed to load walk requests');

        walks.value = await res.json();
        } catch (err) {
            error.value = err.message;
        }
    }


        async function applyToWalk(requestId) {

          try {
            user = await getCurrentUser();
            if (!user) {
              error.value = 'You must be logged in to apply';
              return;
            }

            const res = await fetch(`/api/walks/${requestId}/apply`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ walker_id: user.user_id })
            });

            const result = await res.json();

            if (!res.ok) throw new Error(result.error || 'Application failed');
            message.value = result.message;
            error.value = '';
            await loadWalkRequests();
          } catch (err) {
            error.value = err.message;
            message.value = '';
          }
        }



    function logout() {
        sessionStorage.removeItem('user');
        window.location.href = '/';
    }

    onMounted(async () => {
        currentUser.value = await getCurrentUser();
        if (!currentUser.value || currentUser.value.role !== 'walker') {
        window.location.href = '/';
        return;
        }
        loadWalkRequests();
    });

    return {
        walks,
        message,
        error,
        applyToWalk,
        logout
    };

    }

}).mount('#app');
