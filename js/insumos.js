<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LabFlow Manager - Insumos</title>
    <link href="https://cdn.jsdelivr.net/npm/@mdi/font/css/materialdesignicons.min.css" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">
</head>
<body class="light-mode">

    <header class="top-bar">
        <div class="app-brand">
            <i class="mdi mdi-beaker-outline logo-icon"></i>
            <h1>LabFlow Manager</h1>
        </div>
        <button id="theme-toggle" class="theme-toggle">
            <i class="mdi mdi-theme-light-dark"></i>
        </button>
    </header>

    <div class="container">
        <nav class="sidebar collapsed" id="sidebar">
            <!-- Sidebar content -->
        </nav>

        <main class="page-container">
            <div class="header-dashboard">
                <h1>Insumos</h1>
                <p>Gestión de insumos del laboratorio</p>
            </div>

            <div class="insumos-container">
                <button class="btn" id="add-insumo">Agregar Insumo</button>
                <table class="insumos-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Categoría</th>
                            <th>Cantidad</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="insumos-list">
                        <!-- Lista de insumos -->
                    </tbody>
                </table>
            </div>

            <footer class="dashboard-footer">
                &copy; 2023 LabFlow Manager | <a href="#">Términos de uso</a> | <a href="#">Política de privacidad</a>
            </footer>
        </main>
    </div>

    <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
    <script src="js/insumos.js"></script>
</body>
</html>