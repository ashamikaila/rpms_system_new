<?php
require __DIR__ . '/config.php';
api_require_login(['admin', 'adviser', 'student']);

$documentId = trim((string)($_GET['id'] ?? ''));
if ($documentId === '' || strlen($documentId) > 128) {
    http_response_code(400);
    exit('Invalid document reference.');
}
$fileUrl = 'documents_api.php?action=file&id=' . rawurlencode($documentId);
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#ffffff">
    <title>Document Preview | PRISM</title>
    <link rel="icon" type="image/png" href="assets/images/prismicon.png">
    <style>
        * { box-sizing: border-box; }
        html, body { width: 100%; height: 100%; margin: 0; }
        body { display: grid; grid-template-rows: 56px minmax(0, 1fr); background: #f3f5fa; color: #11133f; font: 14px Arial, sans-serif; }
        header { display: flex; align-items: center; gap: 12px; padding: 0 20px; border-bottom: 1px solid #e6e8f0; background: #fff; }
        header img { display: block; width: 104px; max-height: 38px; object-fit: contain; object-position: left center; }
        header span { padding-left: 12px; border-left: 1px solid #e6e8f0; color: #696b80; font-size: 13px; }
        iframe { width: 100%; height: 100%; border: 0; background: #e9ebf2; }
        @media (max-width: 480px) { header { height: 50px; padding: 0 14px; } body { grid-template-rows: 50px minmax(0, 1fr); } }
    </style>
</head>
<body>
    <header><img src="assets/images/prismlogo1.png" alt="PRISM"><span>Document Preview</span></header>
    <iframe title="Submitted document" src="<?= htmlspecialchars($fileUrl, ENT_QUOTES, 'UTF-8') ?>"></iframe>
</body>
</html>
