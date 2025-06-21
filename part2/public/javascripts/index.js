    const { createApp, ref, onMounted } = Vue;

    createApp({
      setup() {
        // *** Data properties ***
        const message = ref('Welcome to the Dog Walking Service!');
        const dogs = ref([]);
        const loading = ref(true);
        const error = ref('');
        let loginForm = ref({
          username: '',
          password: ''
        });

        async function getRandomDogPhoto() {
          try {
            const response = await fetch('https://dog.ceo/api/breeds/image/random');
            const data = await response.json();

            if (data.status === 'success') {
              return data.message;
            }
          } catch (error) {
            console.error('Failed to fetch dog photo:', error);
          }
          // Return default image if API fails
          return '/images/default-dog.jpg';
        }

        async function loadDogs() {
          try {
            loading.value = true;
            error.value = '';

            // Fetch dogs from our API
            const response = await fetch('/api/dogs');
            const dogsData = await response.json();

            // Fetch random photos for each dog
            const dogsWithPhotos = await Promise.all(
              dogsData.map(async (dog) => {
                const photo_url = await getRandomDogPhoto();
                return {
                  ...dog,
                  photo_url
                };
              })
            );

            dogs.value = dogsWithPhotos;
          } catch (err) {
            error.value = 'Error loading dogs. Please try again later.';
          } finally {
            loading.value = false;
          }
        }

        async function handleImageError(event, dog) {
          // Try to fetch a new random image
          const newPhoto = await getRandomDogPhoto();
          event.target.src = newPhoto;
        }

        async function handleLogin() {
            loginForm = document.getElementById('loginForm');

            if (loginForm) {
                loginForm.addEventListener('submit', async (e) => {
                    e.preventDefault();

                    const username = document.getElementById('username').value;
                    const password = document.getElementById('password').value;

                    try {
                        const response = await fetch('/api/users/login', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ username, password })
                        });

                        const data = await response.json();

                        if (response.ok) {
                            // Store user info in sessionStorage
                            sessionStorage.setItem('user', JSON.stringify(data.user));

                            // Redirect based on role
                            if (data.user.role === 'owner') {
                                // Owner Page
                                window.location.href = '../owner-dashboard.html';
                            } else if (data.user.role === 'walker') {
                                // Walker Page
                                window.location.href = '../walker-dashboard.html';
                            }
                        } else {
                            alert('Login failed: ' + data.error);
                        }
                    } catch (error) {
                        alert('Login error: ' + error.message);
                    }
                });
            }
        }

        onMounted(() => {
          loadDogs();
        });

        return {
          message,
          dogs,
          loading,
          error,
          loginForm,
          handleLogin,
          handleImageError
        };
      }
    }).mount('#app');