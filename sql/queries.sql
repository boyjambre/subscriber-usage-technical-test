-- 1. Menambahkan data pelanggan baru bernama Fajar.
INSERT INTO
    subscribers (
        id,
        name,
        plan,
        activation_date
    )
VALUES (
        'SUB07',
        'Fajar',
        'Basic',
        '2024-01-24'
    );

-- 2. Mengubah paket Fajar menjadi Premium.
UPDATE subscribers SET plan = 'Premium' WHERE id = 'SUB07';

-- 3. Menghitung total penggunaan data pelanggan paket Premium.
SELECT s.id, s.name, SUM(u.dataUsageMB) AS totalDataUsageMB
FROM subscribers s
    JOIN usage u ON u.subscriberId = s.id
WHERE
    s.plan = 'Premium'
GROUP BY
    s.id,
    s.name
ORDER BY totalDataUsageMB DESC;

-- 4. Menampilkan 3 pelanggan dengan penggunaan data tertinggi.
SELECT s.id, s.name, SUM(u.dataUsageMB) AS totalDataUsageMB
FROM subscribers s
    JOIN usage u ON u.subscriberId = s.id
GROUP BY
    s.id,
    s.name
ORDER BY totalDataUsageMB DESC
LIMIT 3;

-- 5. Menampilkan pelanggan dengan rata-rata durasi telepon maksimal 30 menit.
SELECT s.id, s.name
FROM subscribers s
WHERE
    s.id IN (
        SELECT u.subscriberId
        FROM usage u
        GROUP BY
            u.subscriberId
        HAVING
            AVG(u.callMinutes) <= 30
    );