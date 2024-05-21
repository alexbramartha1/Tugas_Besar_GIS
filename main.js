const apiUrl = 'https://gisapis.manpits.xyz/api/login';

const contactForm = document.getElementById('dataForm');
var token = localStorage.getItem('token');

if (!token) {
    contactForm.addEventListener('submit', function (event) {
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        console.log(email);
        console.log(password);
    
        const data = {
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
            return response.text();
        })
        .then(data => {
            dataObj = JSON.parse(data)
            if (dataObj.meta.message == "Successfully logged in") {
                alert(dataObj.meta.message);
                localStorage.setItem('token', dataObj.meta.token);
                window.location.href = "mapview.html"; // Mengarahkan ke halaman login jika login berhasil
            } else {
                alert(dataObj.meta.message); // Menampilkan pesan kesalahan jika ada
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    });
} else {
    window.location.href = "mapview.html";
}

document.getElementById("register").addEventListener("click", function() {
    window.location.href = "register.html";
});
