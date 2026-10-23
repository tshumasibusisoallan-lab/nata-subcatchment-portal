        // --- Navigation Logic (Page Switcher) ---
        const navLinks = document.querySelectorAll('.nav-link');
        const sections = document.querySelectorAll('.page-section');
        const mobileMenu = document.getElementById('mobile-menu');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // 1. Get the target page ID
                const targetId = link.getAttribute('data-target');
                
                // 2. Hide all sections
                sections.forEach(section => {
                    section.classList.remove('active');
                });

                // 3. Show the targeted section
                const targetSection = document.getElementById('page-' + targetId);
                if (targetSection) {
                    targetSection.classList.add('active');
                }

                // 4. Close mobile menu if open
                if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                    mobileMenu.classList.add('hidden');
                }

                // 5. Scroll to top of the page
                window.scrollTo({ top: 0, behavior: 'smooth' });

                // 6. Update active link styling
                navLinks.forEach(navLink => {
                    // Reset all desktop and mobile links
                    if(navLink.parentElement.tagName === 'NAV' || navLink.parentElement.id === 'mobile-menu') {
                        navLink.classList.remove('text-sky-700', 'font-bold');
                        navLink.classList.add('text-slate-600', 'font-medium');
                    }
                });
                
                // Highlight the clicked link
                const activeLinks = document.querySelectorAll(`.nav-link[data-target="${targetId}"]`);
                activeLinks.forEach(activeLink => {
                    activeLink.classList.remove('text-slate-600', 'font-medium');
                    activeLink.classList.add('text-sky-700', 'font-bold');
                });

                // 7. If switching to the About page (which contains the map), 
                // tell Leaflet to resize in case it was initialized while hidden
                if (targetId === 'about' && typeof map !== 'undefined') {
                    setTimeout(() => {
                        map.invalidateSize();
                    }, 100);
                }
            });
        });

        // Mobile Menu Toggle
        const menuBtn = document.getElementById('mobile-menu-btn');
        if (menuBtn && mobileMenu) {
            menuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }

        // --- Map Initialization ---
        // Initialize Leaflet Map centered over Nata Sub-Catchment region
        const map = L.map('map').setView([-20.0, 27.2], 8);

        // Add Esri World Street Map base tile layer
        const baseLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 18,
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USGS, NOAA'
        }).addTo(map);

        // 1. Catchment Boundary Layer
        let catchmentBoundaryLayer = L.geoJSON(null, {
            style: {
                color: '#0284c7',
                weight: 3,
                opacity: 0.9,
                fillColor: '#38bdf8',
                fillOpacity: 0.18,
                dashArray: '6, 6'
            },
            onEachFeature: function(feature, layer) {
                let popupText = `<div class="p-1"><strong class="font-bold text-sky-200">Nata Sub-Catchment Boundary</strong><br>`;
                if (feature.properties) {
                    for (let key in feature.properties) {
                        popupText += `<span class="text-xs text-slate-200 block"><strong>${key}:</strong> ${feature.properties[key]}</span>`;
                    }
                }
                popupText += `</div>`;
                layer.bindPopup(popupText, {className: 'custom-popup'});
            }
        }).addTo(map);

        // Load NSCC Boundary data
        if (typeof nsccBoundaryData !== 'undefined') {
            catchmentBoundaryLayer.addData(nsccBoundaryData);
            if (catchmentBoundaryLayer.getBounds().isValid()) {
                map.fitBounds(catchmentBoundaryLayer.getBounds(), { padding: [30, 30] });
            }
        }

        // 2. Nata Wards Layer
        const nataWardsLayer = L.geoJSON(null, {
            style: {
                color: '#10b981',
                weight: 1.5,
                opacity: 0.8,
                fillColor: '#34d399',
                fillOpacity: 0.15
            },
            onEachFeature: function(feature, layer) {
                let popupText = `<div class="p-1"><strong class="font-bold text-emerald-200">Ward Details</strong><br>`;
                if (feature.properties) {
                    for (let key in feature.properties) {
                        popupText += `<span class="text-xs text-slate-200 block"><strong>${key}:</strong> ${feature.properties[key]}</span>`;
                    }
                }
                popupText += `</div>`;
                layer.bindPopup(popupText, {className: 'custom-popup'});
            }
        });

        // Load Nata Wards data
        if (typeof nataWardsData !== 'undefined') {
            nataWardsLayer.addData(nataWardsData);
        }

        // 3. Sample Boreholes Data
        const boreholesData = [
            { lat: -19.81, lng: 27.75, name: "Tsholotsho Growth Point Borehole #1", status: "Active (Permitted)" },
            { lat: -20.48, lng: 27.03, name: "Plumtree Border Hydrological Borehole", status: "Active (Permitted)" },
            { lat: -20.15, lng: 27.25, name: "Bulilima Rural Water Point B4", status: "Active (Permitted)" },
            { lat: -19.65, lng: 27.40, name: "Sipepa Irrigation Borehole", status: "Active (Permitted)" }
        ];

        // 4. Sample Hydrometric Stations Data
        const stationsData = [
            { lat: -19.92, lng: 27.35, name: "Nata River Hydro Station N1", type: "Streamflow Gauging" },
            { lat: -20.25, lng: 27.60, name: "Manzamnyama Groundwater Level Station", type: "Piezometer Monitoring" }
        ];

        // 5. Sample River Tributary Coordinates
        const riverCoordinates = [
            [-20.50, 28.00],
            [-20.20, 27.70],
            [-19.90, 27.35],
            [-19.50, 26.80]
        ];

        // Layer Groups
        const boreholesLayer = L.layerGroup();
        const stationsLayer = L.layerGroup();
        const riverLayer = L.layerGroup();

        boreholesData.forEach(b => {
            L.circleMarker([b.lat, b.lng], {
                radius: 8,
                fillColor: "#2563eb",
                color: "#ffffff",
                weight: 2,
                opacity: 1,
                fillOpacity: 0.9
            }).bindPopup(`<div class="p-1"><strong class="font-bold text-sky-200">${b.name}</strong><br><span class="text-xs text-slate-200">Status: ${b.status}</span></div>`, {className: 'custom-popup'})
            .addTo(boreholesLayer);
        });

        stationsData.forEach(s => {
            L.circleMarker([s.lat, s.lng], {
                radius: 9,
                fillColor: "#059669",
                color: "#ffffff",
                weight: 2,
                opacity: 1,
                fillOpacity: 0.9
            }).bindPopup(`<div class="p-1"><strong class="font-bold text-emerald-200">${s.name}</strong><br><span class="text-xs text-slate-200">Type: ${s.type}</span></div>`, {className: 'custom-popup'})
            .addTo(stationsLayer);
        });

        L.polyline(riverCoordinates, {
            color: '#0ea5e9',
            weight: 4,
            opacity: 0.8
        }).bindPopup(`<div class="p-1"><strong class="font-bold text-cyan-200">Gwayi Tributary Network</strong></div>`, {className: 'custom-popup'})
        .addTo(riverLayer);

        // Add default visible layers to map
        boreholesLayer.addTo(map);
        stationsLayer.addTo(map);
        riverLayer.addTo(map);

        // Add Layer Control widget containing all active overlays
        const overlayMaps = {
            "Catchment Boundary (NSCC)": catchmentBoundaryLayer,
            "Nata Wards": nataWardsLayer,
            "Boreholes": boreholesLayer,
            "Monitoring Stations": stationsLayer,
            "River Systems": riverLayer
        };                        

        L.control.layers(null, overlayMaps, { collapsed: false, position: 'topright' }).addTo(map);
