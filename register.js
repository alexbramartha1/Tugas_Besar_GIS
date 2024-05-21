const apiUrl = 'https://gisapis.manpits.xyz/api/register';

const contactForm = document.getElementById('dataForm');

contactForm.addEventListener('submit', function (event) {
    const username = document.getElementById('username').value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    
    console.log(username);
    console.log(email);
    console.log(password);

    const data = {
        name: username,
        email: email,
        password: password
    };

    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };

    fetch(apiUrl, requestOptions)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json(); // Mengubah respon menjadi JSON
    })
    .then(data => {
        if (data.meta.message == "Successfully create user") {
            alert(data.meta.message);
            window.location.href = "index.html"; // Mengarahkan ke halaman login jika login berhasil
        } else {
            alert(data.meta.message); // Menampilkan pesan kesalahan jika ada
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

document.getElementById("register").addEventListener("click", function() {
    window.location.href = "index.html";
});