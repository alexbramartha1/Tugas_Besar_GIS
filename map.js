const token = localStorage.getItem("token");

if (!token) {

    window.location.href = "index.html";

} else {

    var kabupatenList = [];
    var kecamatanList = [];
    var desaList = [];
    var perkerasanList = [];
    var kondisiList = [];
    var jenisList = [];

    var selectedKabupaten = "";
    var selectedKecamatan = "";
    var selectedDesa= "";
    var selectedPerkerasan = "";
    var selectedKondisi = "";
    var selectedJenis = "";

    var selectedKabupatenId = 0;
    var selectedKecamatanId = 0;
    var selectedDesaId = 0;
    var selectedPerkerasanId = 0;
    var selectedKondisiId = 0;
    var selectedJenisId = 0;
    var totalDistance = 0;
    var encodedPath = "";
    
    var desaGet = [];
    var kecamatanGet = [];
    var kabupatenGet = [];
    var ruasJalanGet = [];

    var desaNama = "";
    var kecamatanNama = "";
    var kabupatenNama = "";

    var desaKecId = 0;
    var kecKabId = 0;

    var idRuasJalan = 0;


    if (selectedKabupatenId == 0) {
        document.querySelector("#overlay-data").style.display = "none";
    } else {
        document.querySelector("#overlay-data").style.display = "absolute";
    }

    // Load saved polylines when the page loads
    document.addEventListener('DOMContentLoaded', function() {
        getDataAllDesaKecamatanKabupaten();
        loadSavedPolylines();
        updateEncodedPath([]); // Initialize with empty path
    });    

    window.addEventListener('load', function() {
        getDataAllDesaKecamatanKabupaten();
        loadSavedPolylines();
        updateEncodedPath([]); // Initialize with empty path
    });

    var map = L.map('map').setView([-8.8008012, 115.1612023], 10);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 100,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    
    navigator.geolocation.getCurrentPosition(position => {
        const { coords: { latitude, longitude }} = position;
    
        var myIcon = L.icon({
            iconUrl: 'icon/your_loc.png',
            iconSize: [35, 40],
            iconAnchor: [16, 10],
        });
        
        var marker = new L.marker([latitude, longitude], {
        draggable: false,
        icon: myIcon,
        autoPan: true
        }).addTo(map);
    
        map.setView([latitude, longitude], 10);
    
        marker.bindPopup("<b>You're here!").openPopup();
        console.log(marker);
    })
    
    // Array to hold the markers
    var markers = [];

    // Create a polyline and add it to the map with thicker weight
    var polyline = L.polyline([], {color: 'red', weight: 5}).addTo(map); // Weight set to 5 for thicker polyline

    // Function to update the polyline based on marker positions
    function updatePolyline() {
        var latlngs = markers.map(marker => marker.getLatLng());
        polyline.setLatLngs(latlngs);
        updateLength();
        updateEncodedPath(latlngs); // Update encoded path
    }

    // Function to calculate the total length of the polyline
    function updateLength() {
        var latlngs = polyline.getLatLngs();

        for (var i = 0; i < latlngs.length - 1; i++) {
            totalDistance += latlngs[i].distanceTo(latlngs[i + 1]);
        }

        // Display the total distance in the input field in meters
        console.log('Total Distance: ' + totalDistance.toFixed(2) + ' meters');
    }

    // Function to encode the path
    function encodePath(latlngs) {
        var result = '';

        var encode = function(num) {
            num = num < 0 ? ~(num << 1) : num << 1;
            var encoded = '';
            while (num >= 0x20) {
                encoded += String.fromCharCode((0x20 | (num & 0x1f)) + 63);
                num >>= 5;
            }
            encoded += String.fromCharCode(num + 63);
            return encoded;
        };

        var prevLat = 0, prevLng = 0;

        for (var i = 0; i < latlngs.length; i++) {
            var lat = Math.round(latlngs[i].lat * 1e5);
            var lng = Math.round(latlngs[i].lng * 1e5);

            result += encode(lat - prevLat);
            result += encode(lng - prevLng);

            prevLat = lat;
            prevLng = lng;
        }

        return result;
    }

    // Function to update the encoded path variable
    function updateEncodedPath(latlngs) {
        encodedPath = encodePath(latlngs);
        console.log('Encoded Path:', encodedPath);
    }

    // Event listener for map clicks
    map.on('click', function(e) {
        var marker = L.marker(e.latlng, {draggable: true}).addTo(map);
        marker.on('drag', updatePolyline);
        markers.push(marker);
        updatePolyline();
        document.getElementById("panjang-data").textContent = totalDistance.toFixed(2) + ' meters';
    });
    
    function decodePath(encoded) {
        var len = encoded.length;
        var index = 0;
        var lat = 0;
        var lng = 0;
        var array = [];
    
        while (index < len) {
            var b;
            var shift = 0;
            var result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            var dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
            lat += dlat;
    
            shift = 0;
            result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            var dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
            lng += dlng;
    
            array.push([lat / 1e5, lng / 1e5]);
        }
    
        return array;
    }
    
    function getDataAllDesaKecamatanKabupaten() {
        const apiGetAll = "https://gisapis.manpits.xyz/api/mregion"

        const requestOptionsGetAll = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },            
        };

        fetch(apiGetAll, requestOptionsGetAll)
        .then(response => {
            if (!response.ok) {
                throw new Error('Logout failed. Please try again.'); // Memberikan pesan kesalahan yang lebih umum
            }
            return response.json();
        })
        .then(data => {
            
            data.desa.forEach(function(desa){
                desaGet.push({id: desa.id, kec_id: desa.kec_id, desa: desa.desa});
            })

            data.kecamatan.forEach(function(kecamatan){
                kecamatanGet.push({id: kecamatan.id, kab_id: kecamatan.kab_id, kecamatan: kecamatan.kecamatan});
            })

            data.kabupaten.forEach(function(kabupaten){
                kabupatenGet.push({id: kabupaten.id, prov_id: kabupaten.prov_id, kabupaten: kabupaten.kabupaten});
            })
        })

        .catch(function(error) {
            console.error('Error loading saved polylines:', error);
        });
    }

    function loadSavedPolylines() {
        const apiUrlLoadRuas = "https://gisapis.manpits.xyz/api/ruasjalan";

        event.preventDefault()
        const requestOptionsKabupaten = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },            
        };

        fetch(apiUrlLoadRuas, requestOptionsKabupaten)
        .then(response => {
            if (!response.ok) {
                throw new Error('Logout failed. Please try again.'); // Memberikan pesan kesalahan yang lebih umum
            }
            return response.json();
        })
        .then(data => {    
            console.log('Loaded polylines:', data.ruasjalan);

            data.ruasjalan.forEach(function(ruasJalan) {  
                ruasJalanGet.push({id: ruasJalan.id, desa_id: ruasJalan.desa_id, kode_ruas: ruasJalan.kode_ruas, nama_ruas: ruasJalan.nama_ruas, panjang: ruasJalan.panjang, lebar: ruasJalan.lebar, eksisting_id: ruasJalan.eksisting_id, kondisi_id: ruasJalan.kondisi_id, jenisjalan_id: ruasJalan.jenisjalan_id, keterangan: ruasJalan.keterangan});
                idRuasJalan = ruasJalan.id

                desaGet.forEach(function(desaGet){
                    if (desaGet.id == ruasJalan.desa_id) {
                        desaKecId = desaGet.kec_id;
                        desaNama = desaGet.desa;
                    }
                });

                kecamatanGet.forEach(function(kecamatanGet){
                    if (kecamatanGet.id == desaKecId) {
                        kecKabId = kecamatanGet.kab_id;
                        kecamatanNama = kecamatanGet.kecamatan;
                    }
                });

                kabupatenGet.forEach(function(kabupatenGet){
                    if (kabupatenGet.id == kecKabId) {
                        kabupatenNama = kabupatenGet.kabupaten;
                    } 
                });
  
                var latlngs = decodePath(ruasJalan.paths);
                var savedPolyline = L.polyline(latlngs, {color: '#6374db', weight: 7}).addTo(map);
                savedPolyline.bindPopup(`Nama Desa: ${desaNama}<br>Nama Kecamatan: ${kecamatanNama}<br>Nama Kabupaten: ${kabupatenNama}<br>Nama Ruas: ${ruasJalan.nama_ruas}<br>Panjang: ${ruasJalan.panjang} meter<br>Lebar: ${ruasJalan.lebar} meter<br>Keterangan: ${ruasJalan.keterangan}<br><br><button id="editButton">Edit</button><br><button id="deleteButton" onclick="myFunctionDelete(${idRuasJalan})">Delete</button>`);
            });
        })
        .catch(function(error) {
            console.error('Error loading saved polylines:', error);
        });
    }

    function myFunctionDelete(idData) {
        const apiUrlDeleteRuas = `https://gisapis.manpits.xyz/api/ruasjalan/${idData}`;

        event.preventDefault()
        const requestOptionsDelete = {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },            
        };

        fetch(apiUrlDeleteRuas, requestOptionsDelete)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete!'); // Memberikan pesan kesalahan yang lebih umum
            }
            return response.json();
        })
        .then(data => {    
            alert(data.status)
            location.reload();
        })
        .catch(function(error) {
            console.error('Error deleting:', error);
        });
    }

    document.getElementById("lihat-ruas").addEventListener("click", function(event){
        event.preventDefault();
        populateTable(ruasJalanGet);
        
        document.getElementById("table-overlay").style.display = "block";
    });


    // Fungsi untuk mengisi tabel
    function populateTable(data) {
        const tableBody = document.getElementById('data-table-body');

        tableBody.innerHTML = '';
        const uniqueArray = data.filter((item, index) => data.indexOf(item) === index);
        uniqueArray.forEach(item => {

                const row = document.createElement('tr');

                Object.values(item).forEach(value => {
                    const cell = document.createElement('td');
                    cell.textContent = value;
                    row.appendChild(cell);
                });

                tableBody.appendChild(row);
        });
    }

    document.getElementById("close-overlay").addEventListener("click", function(event){
        event.preventDefault();

        document.getElementById("table-overlay").style.display = "none";
    })

    const apiUrl = "https://gisapis.manpits.xyz/api/logout";
    
    console.log(`token ${token}`)

    document.getElementById("logout").addEventListener("click", function() {
        event.preventDefault()
    
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },            
        };

        fetch(apiUrl, requestOptions)
        .then(response => {
            if (!response.ok) {
                throw new Error('Logout failed. Please try again.'); // Memberikan pesan kesalahan yang lebih umum
            }
            return response.json();
        })
        .then(data => {
            alert(`${data.meta.message}`); // Menampilkan pesan sukses atau pesan kesalahan
            localStorage.removeItem('token'); // Menghapus token dari localStorage
            window.location.href = "index.html";
        })
        .catch(error => {
            alert(`Your session is Expired!`);
            localStorage.removeItem('token'); // Menghapus token dari localStorage
            window.location.href = "index.html";
        });
    });

    const hamburger = document.querySelector(".hamburger");
    const navMenu = document.querySelector(".nav-menu");

    hamburger.addEventListener("click", mobileMenu);

    function mobileMenu() {
        hamburger.classList.toggle("active");
        navMenu.classList.toggle("active");
    }

    document.getElementById("upload").addEventListener("click", function() {    
        const apiUrlKabupaten = "https://gisapis.manpits.xyz/api/kabupaten/1";

        event.preventDefault()
        const requestOptionsKabupaten = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
                },            
        };

        fetch(apiUrlKabupaten, requestOptionsKabupaten)
        .then(response => {
            if (!response.ok) {
                throw new Error('Logout failed. Please try again.'); // Memberikan pesan kesalahan yang lebih umum
            }
            return response.json();
        })
        .then(data => {
            // alert(`${data.status}`); // Menampilkan pesan sukses atau pesan kesalahan
            
            data.kabupaten.forEach(function(kabupaten) {
                const existingItem = kabupatenList.find(item => item.id === kabupaten.id);
                
                if (!existingItem) {
                    kabupatenList.push({ id: kabupaten.id, value: kabupaten.value });
                }
            });

            kabupatenList.forEach(function(kabupaten) {
                console.log("ID:", kabupaten.id, "Value:", kabupaten.value);
            });
        })
        .catch(error => {
            alert(`Your session is Expired!`);
            localStorage.removeItem('token'); // Menghapus token dari localStorage
            window.location.href = "index.html";
        });
        
        document.querySelector(".overlay-input").style.display = "flex"; // Menampilkan formulir saat tombol diklik
    });

    document.getElementById("register").addEventListener("click", function(event){
        event.preventDefault()
        hideOverlay();
    });
    
    function hideOverlay() {
        document.querySelector(".overlay-input").style.display = "none";
        document.getElementById("submit").disabled = true
        document.getElementById("submit").style.color = "gray"; // Warna teks menjadi abu-abu
        document.getElementById("submit").style.backgroundColor = "lightgray"; 
        const buttonPerkerasan = document.querySelector(".dropbtnperkerasan");
        buttonPerkerasan.disabled = true;
        buttonPerkerasan.style.color = "gray"; 
        buttonPerkerasan.style.backgroundColor = "lightgray"; 
        const dropdownPerkerasan = document.getElementById("myDropdownPerkerasan");
        dropdownPerkerasan.classList.remove("showPerkerasan");

        const buttonJenis = document.querySelector(".dropbtnjenis");
        buttonJenis.disabled = true;
        buttonJenis.style.color = "gray"; 
        buttonJenis.style.backgroundColor = "lightgray"; 
        const dropdownJenis = document.getElementById("myDropdownJenis");
        dropdownJenis.classList.remove("showJenis");

        const buttonKondisi = document.querySelector(".dropbtnkondisi");
        buttonKondisi.disabled = true;
        buttonKondisi.style.color = "gray"; 
        buttonKondisi.style.backgroundColor = "lightgray"; 
        const dropdownKondisi = document.getElementById("myDropdownKondisi");
        dropdownKondisi.classList.remove("showKondisi");

        document.querySelector(".dropbtnkabupaten").textContent = "Pilih Kabupaten";
        selectedKabupaten = "";
        selectedKecamatan = "";
        selectedDesa = "";

        kecamatanList = [];

        selectedDesaId = 0;
        selectedKecamatanId = 0;
        selectedKabupatenId = 0;
        selectedPerkerasanId = 0;
        selectedKondisiId = 0;
        selectedJenisId = 0;
        
        document.querySelector(".dropbtnkecamatan").textContent = "Pilih Kecamatan";
        document.querySelector(".dropbtndesa").textContent = "Pilih Desa";
        document.querySelector(".dropbtnperkerasan").textContent = "Pilih Perkerasan";
        document.querySelector(".dropbtnjenis").textContent = "Pilih Jenis Jalan";
        document.querySelector(".dropbtnkondisi").textContent = "Pilih Kondisi Jalan";

        if (selectedKabupaten == "" || selectedKabupaten == "Pilih Kabupaten") {
            const buttonKecamatan = document.querySelector(".dropbtnkecamatan");
            buttonKecamatan.disabled = true;
            buttonKecamatan.style.color = "gray"; // Warna teks menjadi abu-abu
            buttonKecamatan.style.backgroundColor = "lightgray"; 
        } else {
            const buttonKecamatan = document.querySelector(".dropbtnkecamatan");
            buttonKecamatan.disabled = false;
            buttonKecamatan.style.color = "";
            buttonKecamatan.style.backgroundColor = "";
        }

        if (selectedKabupaten == "" && selectedKecamatan == "" || selectedKabupaten == "Pilih Kabupaten" && selectedKecamatan == "Pilih Kecamatan") {
            const buttonKecamatan = document.querySelector(".dropbtndesa");
            buttonKecamatan.disabled = true;
            buttonKecamatan.style.color = "gray"; // Warna teks menjadi abu-abu
            buttonKecamatan.style.backgroundColor = "lightgray"; 
        } else {
            const buttonKecamatan = document.querySelector(".dropbtndesa");
            buttonKecamatan.disabled = false;
            buttonKecamatan.style.color = "";
            buttonKecamatan.style.backgroundColor = "";
        }
    }

    if (selectedKabupaten == "" || selectedKabupaten == "Pilih Kabupaten") {
        const buttonKecamatan = document.querySelector(".dropbtnkecamatan");
        buttonKecamatan.disabled = true;
        buttonKecamatan.style.color = "gray"; // Warna teks menjadi abu-abu
        buttonKecamatan.style.backgroundColor = "lightgray"; 
    } else {
        const buttonKecamatan = document.querySelector(".dropbtnkecamatan");
        buttonKecamatan.disabled = false;
        buttonKecamatan.style.color = "";
        buttonKecamatan.style.backgroundColor = "";
    }

    if (selectedKabupaten == "" && selectedKecamatan == "" || selectedKabupaten == "Pilih Kabupaten" && selectedKecamatan == "Pilih Kecamatan") {
        const buttonDesa = document.querySelector(".dropbtndesa");
        buttonDesa.disabled = true;
        buttonDesa.style.color = "gray"; // Warna teks menjadi abu-abu
        buttonDesa.style.backgroundColor = "lightgray"; 
    } else {
        const buttonDesa = document.querySelector(".dropbtndesa");
        buttonDesa.disabled = false;
        buttonDesa.style.color = "";
        buttonDesa.style.backgroundColor = "";

        const apiUrlKecamatan = `https://gisapis.manpits.xyz/api/kecamatan/${selectedKabupatenId}`;

        event.preventDefault()
        const requestOptionsKecamatan = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
                },            
        };

        fetch(apiUrlKecamatan, requestOptionsKecamatan)
        .then(response => {
            if (!response.ok) {
                throw new Error('Logout failed. Please try again.'); // Memberikan pesan kesalahan yang lebih umum
            }
            return response.json();
        })
        .then(data => {
            // alert(`${data.status}`); // Menampilkan pesan sukses atau pesan kesalahan
            
            data.kecamatan.forEach(function(kecamatan) {
                const existingItem = kecamatanList.find(item => item.id === kecamatan.id);
                
                if (!existingItem) {
                    kecamatanList.push({ id: kecamatan.id, value: kecamatan.value });
                }
            });

            kecamatanList.forEach(function(kecamatan) {
                console.log("ID:", kecamatan.id, "Value:", kecamatan.value);
            });
        })
        .catch(error => {
            alert(`Your session is Expired!`);
            localStorage.removeItem('token'); // Menghapus token dari localStorage
            window.location.href = "index.html";
        });
    }

    function myFunctionKabuputen() {
        event.preventDefault()
        document.getElementById("myDropdownKabupaten").classList.toggle("showKabupaten");
        const dropdown = document.getElementById("myDropdownKabupaten");
        
        document.getElementById("submit").disabled = true
        document.getElementById("submit").style.color = "gray"; // Warna teks menjadi abu-abu
        document.getElementById("submit").style.backgroundColor = "lightgray"; 

        const buttonKecamatan = document.querySelector(".dropbtnkecamatan");
        buttonKecamatan.disabled = true;
        buttonKecamatan.style.color = "gray"; // Warna teks menjadi abu-abu
        buttonKecamatan.style.backgroundColor = "lightgray"; 
        const dropdownKecamatan = document.getElementById("myDropdownKecamatan");
        dropdownKecamatan.classList.remove("showKecamatan");
        buttonKecamatan.textContent = "Pilih Kecamatan";
        selectedKecamatanId = 0;

        const buttonDesa = document.querySelector(".dropbtndesa");
        buttonDesa.disabled = true;
        buttonDesa.style.color = "gray"; // Warna teks menjadi abu-abu
        buttonDesa.style.backgroundColor = "lightgray"; 
        const dropdownDesa = document.getElementById("myDropdownDesa");
        dropdownDesa.classList.remove("showDesa");
        buttonDesa.textContent = "Pilih Desa";
        selectedDesaId = 0;

        const buttonPerkerasan = document.querySelector(".dropbtnperkerasan");
        buttonPerkerasan.disabled = true;
        buttonPerkerasan.style.color = "gray"; 
        buttonPerkerasan.style.backgroundColor = "lightgray"; 
        const dropdownPerkerasan = document.getElementById("myDropdownPerkerasan");
        dropdownPerkerasan.classList.remove("showPerkerasan");

        const buttonJenis = document.querySelector(".dropbtnjenis");
        buttonJenis.disabled = true;
        buttonJenis.style.color = "gray"; 
        buttonJenis.style.backgroundColor = "lightgray"; 
        const dropdownJenis = document.getElementById("myDropdownJenis");
        dropdownJenis.classList.remove("showJenis");

        const buttonKondisi = document.querySelector(".dropbtnkondisi");
        buttonKondisi.disabled = true;
        buttonKondisi.style.color = "gray"; 
        buttonKondisi.style.backgroundColor = "lightgray"; 
        const dropdownKondisi = document.getElementById("myDropdownKondisi");
        dropdownKondisi.classList.remove("showKondisi");

        // Menghapus semua elemen <a> dari inner HTML
        dropdown.querySelectorAll("a").forEach(function(element) {
            element.remove();
        });

        // Loop melalui data dari API dan buat opsi dropdown
        kabupatenList.forEach(item => {
            // Buat elemen anchor untuk setiap opsi dropdown
            let option = document.createElement("a");
            option.href = "#"; // Sesuaikan dengan properti yang Anda miliki dari data API
            option.textContent = item.value; // Sesuaikan dengan properti yang Anda miliki dari data API
            
            // Masukkan opsi dropdown ke dalam dropdown list
            option.addEventListener("click", function(event) {
                event.preventDefault(); // Menghentikan aksi default dari elemen anchor (pindah ke URL)
                
                // Simpan nilai yang dipilih ke dalam variabel yang sesuai
                selectedKabupaten = item.value; // Sesuaikan dengan properti yang Anda miliki dari data API
                const button = document.querySelector(".dropbtnkabupaten");
                
                // Ubah teks placeholder dropdown menjadi nilai yang dipilih
                button.textContent = selectedKabupaten;
                selectedKabupatenId = item.id;

                const buttonKecamatan = document.querySelector(".dropbtnkecamatan");
                buttonKecamatan.disabled = false;
                buttonKecamatan.style.color = "";
                buttonKecamatan.style.backgroundColor = "";
                dropdown.classList.remove("showKabupaten");
                const dropdownKecamatan = document.getElementById("myDropdownKecamatan");
                
                const buttonKecamatanValue = document.querySelector(".dropbtnkecamatan");
                buttonKecamatanValue.textContent = "Pilih Kecamatan";
                
                selectedKecamatanId = 0;
                const buttonDesa = document.querySelector(".dropbtndesa");
                buttonDesa.disabled = false;
                buttonDesa.style.color = "gray"; // Warna teks menjadi abu-abu
                buttonDesa.style.backgroundColor = "lightgray"; 
                
                // Menghapus semua elemen <a> dari inner HTML
                dropdownKecamatan.querySelectorAll("a").forEach(function(element) {
                    element.remove();
                });
                kecamatanList = [];
                const apiUrlKecamatan = `https://gisapis.manpits.xyz/api/kecamatan/${selectedKabupatenId}`;

                const requestOptionsKecamatan = {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },            
                };

                fetch(apiUrlKecamatan, requestOptionsKecamatan)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Logout failed. Please try again.'); // Memberikan pesan kesalahan yang lebih umum
                    }
                    return response.json();
                })
                .then(data => {
                    // alert(`${data.status}`); // Menampilkan pesan sukses atau pesan kesalahan
                    
                    data.kecamatan.forEach(function(kecamatan) {
                        kecamatanList.push({ id: kecamatan.id, value: kecamatan.value });
                    });
                    
                    kecamatanList.forEach(function(kecamatan) {
                        console.log("ID:", kecamatan.id, "Value:", kecamatan.value);
                    });
                })
                .catch(error => {
                    alert(`Your session is Expired!`);
                    localStorage.removeItem('token'); // Menghapus token dari localStorage
                    window.location.href = "index.html";
                });
            });
            // Masukkan opsi dropdown ke dalam dropdown list
            dropdown.appendChild(option);
        });
    }

    function filterFunctionKabupaten() {
        const input = document.getElementById("myInputKabupaten");
        const filter = input.value.toUpperCase();
        const div = document.getElementById("myDropdownKabupaten");
        const a = div.getElementsByTagName("a");

        for (let i = 0; i < a.length; i++) {
            txtValue = a[i].textContent || a[i].innerText;

            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                a[i].style.display = "";
            } else {
                a[i].style.display = "none";
            }
        }
    }

    function myFunctionKecamatan() {
        event.preventDefault()
        document.getElementById("submit").disabled = true
        document.getElementById("submit").style.color = "gray"; // Warna teks menjadi abu-abu
        document.getElementById("submit").style.backgroundColor = "lightgray"; 

        const buttonDesa = document.querySelector(".dropbtndesa");
        buttonDesa.disabled = true;
        buttonDesa.style.color = "gray"; // Warna teks menjadi abu-abu
        buttonDesa.style.backgroundColor = "lightgray"; 
        const dropdownDesa = document.getElementById("myDropdownDesa");
        dropdownDesa.classList.remove("showDesa");
        buttonDesa.textContent = "Pilih Desa";
        selectedDesaId = 0;

        const buttonPerkerasan = document.querySelector(".dropbtnperkerasan");
        buttonPerkerasan.disabled = true;
        buttonPerkerasan.style.color = "gray"; 
        buttonPerkerasan.style.backgroundColor = "lightgray"; 
        const dropdownPerkerasan = document.getElementById("myDropdownPerkerasan");
        buttonPerkerasan.textContent = "Pilih Perkerasan"; 
        dropdownPerkerasan.classList.remove("showPerkerasan");
        selectedPerkerasanId = 0;

        const buttonJenis = document.querySelector(".dropbtnjenis");
        buttonJenis.disabled = true;
        buttonJenis.style.color = "gray"; 
        buttonJenis.style.backgroundColor = "lightgray"; 
        const dropdownJenis = document.getElementById("myDropdownJenis");
        buttonJenis.textContent = "Pilih Jenis Jalan"; 
        dropdownJenis.classList.remove("showJenis");
        selectedJenisId = 0;

        const buttonKondisi = document.querySelector(".dropbtnkondisi");
        buttonKondisi.disabled = true;
        buttonKondisi.style.color = "gray"; 
        buttonKondisi.style.backgroundColor = "lightgray"; 
        const dropdownKondisi = document.getElementById("myDropdownKondisi");
        buttonKondisi.textContent = "Pilih Kondisi Jalan"; 
        dropdownKondisi.classList.remove("showKondisi");
        selectedKondisiId = 0;

        document.getElementById("myDropdownKecamatan").classList.toggle("showKecamatan");
        const dropdown = document.getElementById("myDropdownKecamatan");

        // Menghapus semua elemen <a> dari inner HTML
        dropdown.querySelectorAll("a").forEach(function(element) {
            element.remove();
        });

        // Loop melalui data dari API dan buat opsi dropdown
        kecamatanList.forEach(item => {
            // Buat elemen anchor untuk setiap opsi dropdown
            let option = document.createElement("a");
            option.href = "#"; // Sesuaikan dengan properti yang Anda miliki dari data API
            option.textContent = item.value; // Sesuaikan dengan properti yang Anda miliki dari data API
            
            // Masukkan opsi dropdown ke dalam dropdown list
            option.addEventListener("click", function(event) {
                event.preventDefault(); // Menghentikan aksi default dari elemen anchor (pindah ke URL)

                // Simpan nilai yang dipilih ke dalam variabel yang sesuai
                selectedKecamatanId = item.id;
                selectedKecamatan = item.value; // Sesuaikan dengan properti yang Anda miliki dari data API
                const button = document.querySelector(".dropbtnkecamatan");
                
                // Ubah teks placeholder dropdown menjadi nilai yang dipilih
                button.textContent = selectedKecamatan;

                dropdown.classList.remove("showKecamatan");

                desaList = [];
                const buttonDesa = document.querySelector(".dropbtndesa");
                buttonDesa.disabled = false;
                buttonDesa.style.color = "";
                buttonDesa.style.backgroundColor = "";

                const apiUrlDesa = `https://gisapis.manpits.xyz/api/desa/${selectedKecamatanId}`;

                const requestOptionsDesa = {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },            
                };

                fetch(apiUrlDesa, requestOptionsDesa)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Logout failed. Please try again.'); // Memberikan pesan kesalahan yang lebih umum
                    }
                    return response.json();
                })
                .then(data => {
                    // alert(`${data.status}`); // Menampilkan pesan sukses atau pesan kesalahan
                    
                    data.desa.forEach(function(desa) {
                        desaList.push({ id: desa.id, value: desa.value });
                    });
                    
                    desaList.forEach(function(desa) {
                        console.log("ID:", desa.id, "Value:", desa.value);
                    });
                })
                .catch(error => {
                    alert(`Your session is Expired!`);
                    localStorage.removeItem('token'); // Menghapus token dari localStorage
                    window.location.href = "index.html";
                });
            });
            // Masukkan opsi dropdown ke dalam dropdown list
            dropdown.appendChild(option);
        });
    }
    
    function filterFunctionKecamatan() {
        const input = document.getElementById("myInputKecamatan");
        const filter = input.value.toUpperCase();
        const div = document.getElementById("myDropdownKecamatan");
        const a = div.getElementsByTagName("a");

        for (let i = 0; i < a.length; i++) {
            txtValue = a[i].textContent || a[i].innerText;

            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                a[i].style.display = "";
            } else {
                a[i].style.display = "none";
            }
        }
    }

    if (selectedDesaId == 0) {
        const buttonPerkerasan = document.querySelector(".dropbtnperkerasan");
        buttonPerkerasan.disabled = true;
        buttonPerkerasan.style.color = "gray"; 
        buttonPerkerasan.style.backgroundColor = "lightgray"; 
        const dropdownPerkerasan = document.getElementById("myDropdownPerkerasan");
        dropdownPerkerasan.classList.remove("showPerkerasan");

        const buttonJenis = document.querySelector(".dropbtnjenis");
        buttonJenis.disabled = true;
        buttonJenis.style.color = "gray"; 
        buttonJenis.style.backgroundColor = "lightgray"; 
        const dropdownJenis = document.getElementById("myDropdownJenis");
        dropdownJenis.classList.remove("showJenis");

        const buttonKondisi = document.querySelector(".dropbtnkondisi");
        buttonKondisi.disabled = true;
        buttonKondisi.style.color = "gray"; 
        buttonKondisi.style.backgroundColor = "lightgray"; 
        const dropdownKondisi = document.getElementById("myDropdownKondisi");
        dropdownKondisi.classList.remove("showKondisi");
    }

    function myFunctionDesa() {
        event.preventDefault()
        document.getElementById("submit").disabled = true
        document.getElementById("submit").style.color = "gray"; // Warna teks menjadi abu-abu
        document.getElementById("submit").style.backgroundColor = "lightgray"; 

        document.getElementById("myDropdownDesa").classList.toggle("showDesa");
        document.getElementById("myDropdownPerkerasan").classList.remove("showPerkerasan");
        document.getElementById("myDropdownJenis").classList.remove("showJenis");
        document.getElementById("myDropdownKondisi").classList.remove("showKondisi");
        const dropdown = document.getElementById("myDropdownDesa");

        // Menghapus semua elemen <a> dari inner HTML
        dropdown.querySelectorAll("a").forEach(function(element) {
            element.remove();
        });
        
        // Loop melalui data dari API dan buat opsi dropdown
        desaList.forEach(item => {
            // Buat elemen anchor untuk setiap opsi dropdown
            let option = document.createElement("a");
            option.href = "#"; // Sesuaikan dengan properti yang Anda miliki dari data API
            option.textContent = item.value; // Sesuaikan dengan properti yang Anda miliki dari data API
            
            // Masukkan opsi dropdown ke dalam dropdown list
            option.addEventListener("click", function(event) {
                event.preventDefault(); // Menghentikan aksi default dari elemen anchor (pindah ke URL)
                
                // Simpan nilai yang dipilih ke dalam variabel yang sesuai
                selectedDesa = item.value; // Sesuaikan dengan properti yang Anda miliki dari data API
                const button = document.querySelector(".dropbtndesa");
                
                // Ubah teks placeholder dropdown menjadi nilai yang dipilih
                button.textContent = selectedDesa;
                selectedDesaId = item.id;

                const apiUrlPerkerasan = `https://gisapis.manpits.xyz/api/meksisting`;
                
                perkerasanList = [];
                jenisList = [];
                kondisiList = [];

                const requestOptionsPerkerasan = {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },            
                };

                fetch(apiUrlPerkerasan, requestOptionsPerkerasan)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Logout failed. Please try again.'); // Memberikan pesan kesalahan yang lebih umum
                    }
                    return response.json();
                })
                .then(data => {
                    // alert(`${data.status}`); // Menampilkan pesan sukses atau pesan kesalahan
                    
                    data.eksisting.forEach(function(eksisting) {
                        perkerasanList.push({ id: eksisting.id, value: eksisting.eksisting });
                        console.log(eksisting.id, eksisting.eksisting);
                    });
                    
                    
                })
                .catch(error => {
                    alert(`Your session is Expired!`);
                    localStorage.removeItem('token'); // Menghapus token dari localStorage
                    window.location.href = "index.html";
                });

                const apiUrlJenis = `https://gisapis.manpits.xyz/api/mjenisjalan`;
                
                const requestOptionsJenis = {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },            
                };

                fetch(apiUrlJenis, requestOptionsJenis)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Logout failed. Please try again.'); // Memberikan pesan kesalahan yang lebih umum
                    }
                    return response.json();
                })
                .then(data => {
                    // alert(`${data.status}`); // Menampilkan pesan sukses atau pesan kesalahan
                    
                    data.eksisting.forEach(function(jenisjalan) {
                        jenisList.push({ id: jenisjalan.id, value: jenisjalan.jenisjalan });
                        console.log(jenisjalan.id, jenisjalan.jenisjalan);
                    });
                    
                })
                .catch(error => {
                    alert(`Your session is Expired!`);
                    localStorage.removeItem('token'); // Menghapus token dari localStorage
                    window.location.href = "index.html";
                });

                const apiUrlKondisi = `https://gisapis.manpits.xyz/api/mkondisi`;
                
                const requestOptionsKondisi = {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },            
                };

                fetch(apiUrlKondisi, requestOptionsKondisi)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Logout failed. Please try again.'); // Memberikan pesan kesalahan yang lebih umum
                    }
                    return response.json();
                })
                .then(data => {
                    // alert(`${data.status}`); // Menampilkan pesan sukses atau pesan kesalahan
                    
                    data.eksisting.forEach(function(kondisi) {
                        kondisiList.push({ id: kondisi.id, value: kondisi.kondisi });
                        console.log(kondisi.id, kondisi.kondisi);
                    });
                    
                })
                .catch(error => {
                    alert(`Your session is Expired!`);
                    localStorage.removeItem('token'); // Menghapus token dari localStorage
                    window.location.href = "index.html";
                });

                if (selectedPerkerasanId, selectedJenisId, selectedKondisiId == 0) {        
                    document.getElementById("submit").disabled = true;
                    document.getElementById("submit").style.color = "gray"; // Warna teks menjadi abu-abu
                    document.getElementById("submit").style.backgroundColor = "lightgray"; 
                } else {
                    document.getElementById("submit").disabled = false
                    document.getElementById("submit").style.color = ""; // Warna teks menjadi abu-abu
                    document.getElementById("submit").style.backgroundColor = ""; 
                }

                if (selectedDesaId == 0) {
                    const buttonPerkerasan = document.querySelector(".dropbtnperkerasan");
                    buttonPerkerasan.disabled = true;
                    buttonPerkerasan.style.color = "gray"; 
                    buttonPerkerasan.style.backgroundColor = "lightgray"; 
                    const dropdownPerkerasan = document.getElementById("myDropdownPerkerasan");
                    dropdownPerkerasan.classList.remove("showPerkerasan");
            
                    const buttonJenis = document.querySelector(".dropbtnjenis");
                    buttonJenis.disabled = true;
                    buttonJenis.style.color = "gray"; 
                    buttonJenis.style.backgroundColor = "lightgray"; 
                    const dropdownJenis = document.getElementById("myDropdownJenis");
                    dropdownJenis.classList.remove("showJenis");
            
                    const buttonKondisi = document.querySelector(".dropbtnkondisi");
                    buttonKondisi.disabled = true;
                    buttonKondisi.style.color = "gray"; 
                    buttonKondisi.style.backgroundColor = "lightgray"; 
                    const dropdownKondisi = document.getElementById("myDropdownKondisi");
                    dropdownKondisi.classList.remove("showKondisi");
                } else {
                    const buttonPerkerasan = document.querySelector(".dropbtnperkerasan");
                    buttonPerkerasan.disabled = false;
                    buttonPerkerasan.style.color = ""; 
                    buttonPerkerasan.style.backgroundColor = ""; 
                    const dropdownPerkerasan = document.getElementById("myDropdownPerkerasan");
                    dropdownPerkerasan.classList.remove("showPerkerasan");
            
                    const buttonJenis = document.querySelector(".dropbtnjenis");
                    buttonJenis.disabled = false;
                    buttonJenis.style.color = ""; 
                    buttonJenis.style.backgroundColor = ""; 
                    const dropdownJenis = document.getElementById("myDropdownJenis");
                    dropdownJenis.classList.remove("showJenis");
            
                    const buttonKondisi = document.querySelector(".dropbtnkondisi");
                    buttonKondisi.disabled = false;
                    buttonKondisi.style.color = ""; 
                    buttonKondisi.style.backgroundColor = ""; 
                    const dropdownKondisi = document.getElementById("myDropdownKondisi");
                    dropdownPerkerasan.classList.remove("showKondisi");            
                }
                dropdown.classList.remove("showDesa");
            });
            dropdown.appendChild(option);
        });
    }
      
    function filterFunctionDesa() {
        const input = document.getElementById("myInputDesa");
        const filter = input.value.toUpperCase();
        const div = document.getElementById("myDropdownDesa");
        const a = div.getElementsByTagName("a");

        for (let i = 0; i < a.length; i++) {
            txtValue = a[i].textContent || a[i].innerText;

            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                a[i].style.display = "";
            } else {
                a[i].style.display = "none";
            }
        }
    }

    function myFunctionPerkerasan() {
        event.preventDefault()
        document.getElementById("myDropdownPerkerasan").classList.toggle("showPerkerasan");
        document.getElementById("myDropdownJenis").classList.remove("showJenis");
        document.getElementById("myDropdownKondisi").classList.remove("showKondisi");
        const dropdown = document.getElementById("myDropdownPerkerasan");

        // Menghapus semua elemen <a> dari inner HTML
        dropdown.querySelectorAll("a").forEach(function(element) {
            element.remove();
        });

        // Loop melalui data dari API dan buat opsi dropdown
        perkerasanList.forEach(item => {
            // Buat elemen anchor untuk setiap opsi dropdown
            let option = document.createElement("a");
            option.href = "#"; // Sesuaikan dengan properti yang Anda miliki dari data API
            option.textContent = item.value; // Sesuaikan dengan properti yang Anda miliki dari data API
            
            option.addEventListener("click", function(event) {
                event.preventDefault(); // Menghentikan aksi default dari elemen anchor (pindah ke URL)
                
                // Simpan nilai yang dipilih ke dalam variabel yang sesuai
                selectedPerkerasan = item.value; // Sesuaikan dengan properti yang Anda miliki dari data API
                const button = document.querySelector(".dropbtnperkerasan");
                
                // Ubah teks placeholder dropdown menjadi nilai yang dipilih
                button.textContent = selectedPerkerasan;
                selectedPerkerasanId = item.id;

                dropdown.classList.remove("showPerkerasan");

                if (!selectedPerkerasanId || !selectedJenisId || !selectedKondisiId) {        
                    document.getElementById("submit").disabled = true;
                    document.getElementById("submit").style.color = "gray"; // Warna teks menjadi abu-abu
                    document.getElementById("submit").style.backgroundColor = "lightgray"; 
                } else {
                    document.getElementById("submit").disabled = false
                    document.getElementById("submit").style.color = ""; // Warna teks menjadi abu-abu
                    document.getElementById("submit").style.backgroundColor = ""; 
                }
            });

            dropdown.appendChild(option);
        });
    }
      
    function filterFunctionPerkerasan() {
        const input = document.getElementById("myInputPerkerasan");
        const filter = input.value.toUpperCase();
        const div = document.getElementById("myDropdownPerkerasan");
        const a = div.getElementsByTagName("a");

        for (let i = 0; i < a.length; i++) {
            txtValue = a[i].textContent || a[i].innerText;

            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                a[i].style.display = "";
            } else {
                a[i].style.display = "none";
            }
        }
    }

    function myFunctionJenis() {
        event.preventDefault()
        document.getElementById("myDropdownJenis").classList.toggle("showJenis");
        document.getElementById("myDropdownPerkerasan").classList.remove("showPerkerasan");
        document.getElementById("myDropdownKondisi").classList.remove("showKondisi");
        const dropdown = document.getElementById("myDropdownJenis");

        // Menghapus semua elemen <a> dari inner HTML
        dropdown.querySelectorAll("a").forEach(function(element) {
            element.remove();
        });

        // Loop melalui data dari API dan buat opsi dropdown
        jenisList.forEach(item => {
            // Buat elemen anchor untuk setiap opsi dropdown
            let option = document.createElement("a");
            option.href = "#"; // Sesuaikan dengan properti yang Anda miliki dari data API
            option.textContent = item.value; // Sesuaikan dengan properti yang Anda miliki dari data API
            
            option.addEventListener("click", function(event) {
                event.preventDefault(); // Menghentikan aksi default dari elemen anchor (pindah ke URL)
                
                // Simpan nilai yang dipilih ke dalam variabel yang sesuai
                selectedJenis = item.value; // Sesuaikan dengan properti yang Anda miliki dari data API
                const button = document.querySelector(".dropbtnjenis");
                
                // Ubah teks placeholder dropdown menjadi nilai yang dipilih
                button.textContent = selectedJenis;
                selectedJenisId = item.id;

                dropdown.classList.remove("showJenis");

                if (!selectedPerkerasanId || !selectedJenisId || !selectedKondisiId) {        
                    document.getElementById("submit").disabled = true;
                    document.getElementById("submit").style.color = "gray"; // Warna teks menjadi abu-abu
                    document.getElementById("submit").style.backgroundColor = "lightgray"; 
                } else {
                    document.getElementById("submit").disabled = false
                    document.getElementById("submit").style.color = ""; // Warna teks menjadi abu-abu
                    document.getElementById("submit").style.backgroundColor = ""; 
                }
            });

            dropdown.appendChild(option);
        });
    }
      
    function filterFunctionJenis() {
        const input = document.getElementById("myInputJenis");
        const filter = input.value.toUpperCase();
        const div = document.getElementById("myDropdownJenis");
        const a = div.getElementsByTagName("a");

        for (let i = 0; i < a.length; i++) {
            txtValue = a[i].textContent || a[i].innerText;

            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                a[i].style.display = "";
            } else {
                a[i].style.display = "none";
            }
        }
    }

    function myFunctionKondisi() {
        event.preventDefault()
        document.getElementById("myDropdownKondisi").classList.toggle("showKondisi");
        document.getElementById("myDropdownJenis").classList.remove("showJenis");
        document.getElementById("myDropdownPerkerasan").classList.remove("showPerkerasan");
    
        document.getElementById("submit").disabled = true;
        document.getElementById("submit").style.color = "gray"; // Warna teks menjadi abu-abu
        document.getElementById("submit").style.backgroundColor = "lightgray"; 

        const dropdown = document.getElementById("myDropdownKondisi");

        // Menghapus semua elemen <a> dari inner HTML
        dropdown.querySelectorAll("a").forEach(function(element) {
            element.remove();
        });

        // Loop melalui data dari API dan buat opsi dropdown
        kondisiList.forEach(item => {
            // Buat elemen anchor untuk setiap opsi dropdown
            let option = document.createElement("a");
            option.href = "#"; // Sesuaikan dengan properti yang Anda miliki dari data API
            option.textContent = item.value; // Sesuaikan dengan properti yang Anda miliki dari data API
            
            option.addEventListener("click", function(event) {
                event.preventDefault(); // Menghentikan aksi default dari elemen anchor (pindah ke URL)
                
                // Simpan nilai yang dipilih ke dalam variabel yang sesuai
                selectedKondisi = item.value; // Sesuaikan dengan properti yang Anda miliki dari data API
                const button = document.querySelector(".dropbtnkondisi");
                
                // Ubah teks placeholder dropdown menjadi nilai yang dipilih
                button.textContent = selectedKondisi;
                selectedKondisiId = item.id;

                dropdown.classList.remove("showKondisi");
                
                console.log(!selectedPerkerasan && !selectedJenis && !selectedKondisi)
                console.log(selectedPerkerasan)
                console.log(selectedJenis)
                console.log(selectedKondisi)
                
                if (!selectedPerkerasanId || !selectedJenisId || !selectedKondisiId) {        
                    document.getElementById("submit").disabled = true;
                    document.getElementById("submit").style.color = "gray"; // Warna teks menjadi abu-abu
                    document.getElementById("submit").style.backgroundColor = "lightgray"; 
                } else {
                    document.getElementById("submit").disabled = false
                    document.getElementById("submit").style.color = ""; // Warna teks menjadi abu-abu
                    document.getElementById("submit").style.backgroundColor = ""; 
                }
            });

            dropdown.appendChild(option);
        });
    }
      
    function filterFunctionKondisi() {
        const input = document.getElementById("myInputKondisi");
        const filter = input.value.toUpperCase();
        const div = document.getElementById("myDropdownKondisi");
        const a = div.getElementsByTagName("a");

        for (let i = 0; i < a.length; i++) {
            txtValue = a[i].textContent || a[i].innerText;

            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                a[i].style.display = "";
            } else {
                a[i].style.display = "none";
            }
        }
    }
    
    if (selectedDesaId == 0) {
        document.getElementById("submit").disabled = true
        document.getElementById("submit").style.color = "gray"; // Warna teks menjadi abu-abu
        document.getElementById("submit").style.backgroundColor = "lightgray"; 
    }

    document.getElementById("submit").addEventListener("click", function(event){
        event.preventDefault()
        console.log(selectedKabupaten);
        console.log(selectedKecamatan);
        console.log(selectedDesa);
        console.log(selectedKondisi);
        console.log(selectedJenis);
        console.log(selectedPerkerasan);
        console.log(selectedKabupatenId);

        var namaRuas = document.getElementById("nama-ruas").value
        var lebarRuas = document.getElementById("lebar-ruas").value
        var keteranganRuas = document.getElementById("keterangan-jalan").value
        var kodeRuas = document.getElementById("kode-ruas").value

        document.getElementById("kabupaten-data").textContent = selectedKabupaten;
        document.getElementById("kecamatan-data").textContent = selectedKecamatan;
        document.getElementById("desa-data").textContent = selectedDesa;
        document.getElementById("perkerasan-data").textContent = selectedPerkerasan;
        document.getElementById("jenis-data").textContent = selectedJenis;
        document.getElementById("kondisi-data").textContent = selectedKondisi;
        document.getElementById("nama-data").textContent = namaRuas;
        document.getElementById("lebar-data").textContent = lebarRuas + ' meters';
        document.getElementById("keterangan-data").textContent = keteranganRuas;
        document.getElementById("panjang-data").textContent = totalDistance.toFixed(2) + ' meters';
        document.getElementById("kode-data").textContent = kodeRuas;

        if (selectedKabupatenId == 0 || !namaRuas || !lebarRuas || !keteranganRuas || !kodeRuas) {
            document.getElementById("overlay-data").style.display = "none";
            alert("Mohon isi semua Data!");
        } else {
            document.getElementById("overlay-data").style.display = "block";
            document.body.scrollTop = document.documentElement.scrollHeight;
            document.documentElement.scrollTop = document.documentElement.scrollHeight;
            hideOverlayWithoutLosingData();
        }
    });

    document.getElementById("submit-data").addEventListener("click", function(event){
        event.preventDefault()

        var namaRuas = document.getElementById("nama-ruas").value
        var lebarRuas = document.getElementById("lebar-ruas").value
        var keteranganRuas = document.getElementById("keterangan-jalan").value
        var kodeRuas = document.getElementById("kode-ruas").value

        console.log(encodedPath);
        console.log(selectedDesaId);
        console.log(kodeRuas);
        console.log(namaRuas);
        console.log(totalDistance.toFixed(2));
        console.log(lebarRuas);
        console.log(selectedPerkerasanId);
        console.log(selectedKondisiId);
        console.log(selectedJenisId);
        console.log(keteranganRuas);

        if (!encodedPath || !totalDistance) {
            document.getElementById("overlay-data").style.display = "block";
            alert("Mohon tandai Jalan!");
        } else {
            const apiUrlSubmit = 'https://gisapis.manpits.xyz/api/ruasjalan';

            const data = {
                paths: encodedPath,
                desa_id: selectedDesaId,
                kode_ruas: kodeRuas,
                nama_ruas: namaRuas,
                panjang: totalDistance.toFixed(2),
                lebar: lebarRuas,
                eksisting_id: selectedPerkerasanId,
                kondisi_id: selectedKondisiId, 
                jenisjalan_id: selectedJenisId,
                keterangan: keteranganRuas 
            };

            const requestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            };

            fetch(apiUrlSubmit, requestOptions)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(data => {
                dataObj = JSON.parse(data)

                if (dataObj.status == "success") {
                    alert(dataObj.status)
                    document.getElementById("overlay-data").style.display = "none";
                    hideOverlay();
                    document.body.scrollTop = 0; // For Safari
                    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
                    location.reload();
                } 
            })
            .catch(error => {
                console.error('Error:', error);
            });
        }
    })

    document.getElementById("edit-info").addEventListener("click", function(event){
        event.preventDefault()
        document.querySelector(".overlay-input").style.display = "flex";
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
        document.getElementById("overlay-data").style.display = "none";
    });

    function hideOverlayWithoutLosingData() {
        event.preventDefault()
        document.querySelector(".overlay-input").style.display = "none";
    }

    window.onscroll = function() {scrollFunction()};
        
    function scrollFunction() {
        var scrollToTopBtn = document.getElementById("scrollToTopBtn");
        if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
            scrollToTopBtn.style.display = "block";
        } else {
            scrollToTopBtn.style.display = "none";
        }
    }

    function scrollToTop() {
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    }

}

