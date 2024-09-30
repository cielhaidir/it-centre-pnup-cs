const express = require('express')
const axios = require('axios');
const app = express()
const port = 3001;
const bodyParser = require('body-parser');
//sadsad
const { Client, LocalAuth, MessageMedia, Poll } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const wwebVersion = '2.2412.54';


const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-extensions'] },
    webVersionCache: {
        type: 'remote',
        remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${wwebVersion}.html`,
    },
});

client.on('qr', (qr) => {
    // Generate and scan this code with your phone
    qrcode.generate(qr, { small: true });
    console.log('QR RECEIVED', qr);
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', msg => {
    if (msg.body == '!ping') {
        msg.reply('pong');
    }
});

try {
    client.initialize();
} catch (error) {
    console.error('Error initializing WhatsApp client:', error);
    // Handle the error, optionally restart the client, or continue execution
}

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.post('/laporan', async (req, res) => {

    const { id, nama, jenis_pelapor, jenis_masalah, urgensi_masalah, alat_bermasalah, spesifikasi_kendaraan, nomor_inventaris, no_pelapor, bukti, lokasi, ruangan, keluhan, pj1 } = req.body;
    console.log(req.body);
    if (pj1 === undefined) {
        return res.status(400).json({ success: false, message: 'Field "pj1" tidak ditemukan dalam body permintaan.' });
    }

    let pesan = `Assalamualaikum Wr. Wb.
*Laporan Panraki APP* 
Berikut adalah detail laporan:
id Laporan : *${id}*
Nama Pelapor: *${nama}*
Asal Pelapor: *${jenis_pelapor}*
Nomor Pelapor: *${no_pelapor}*
Jenis Masalah : *${jenis_masalah}*
Lokasi Kejadian: *${lokasi}*
Lokasi/Ruangan : *${ruangan}*
`
    if (urgensi_masalah) {
        pesan += `Sifat Laporan/Pengaduan: *${urgensi_masalah}*`
    }

    if (alat_bermasalah) {
        pesan += `
        Nama Alat/Mesin: *${alat_bermasalah}*`
    }

    if (spesifikasi_kendaraan) {
        pesan += `Spesifikasi Kendaraan: *${spesifikasi_kendaraan}*`
    }

    if (nomor_inventaris) {
        pesan += `
Nomor Inventaris: *${nomor_inventaris}*`
    }


    pesan += `
Keluhan: *${keluhan}*

Mohon untuk segera ditindaklanjuti dan diperiksa lebih lanjut. Terima kasih atas perhatiannya.

Tolong berikan respon anda di polling berikut :
    `;

    tujuan = formatnomor(pj1);


    const media = new MessageMedia('image/png', bukti);

    try {
    if(bukti){
        await client.sendMessage(tujuan, media, { caption: pesan });
    }else{
        await client.sendMessage(tujuan, pesan);
    }
    await client.sendMessage(tujuan, new Poll(`Respon *${id}* `, [`Proses ${id}`, `Selesai ${id}`, `Pending ${id} `]));
} catch (error) {
    console.error('Error sending message:', error);
    // Handle the error, optionally restart the client, or continue execution
}
    //return success and id,
    res.json({ success: true, message: 'Laporan berhasil diteruskan.' });
});


// const validApiKeys = new Set(['12345', '67890']);
const rico = '081237573018'

app.get('/electric', async (req, res) => {
    const { message } = req.query;
    client.sendMessage(formatnomor(rico), message)
    res.json({ status: 'Message sent'});
});


// app.get('/electric-down', async (req, res) => {
//     const { message } = req.query;
//     // let pesan = `Listrik Mati`
//     client.sendMessage(formatnomor(rico), message)
// });


client.on('vote_update', async (vote) => {

    if (vote.selectedOptions && vote.selectedOptions.length > 0) {
        const name = vote.selectedOptions[0].name;
        const tujuan = vote.voter;

        console.log(vote);
        const [command, id] = name.split(' ', 2);
        processCommand(command, id, tujuan);
    }

});


async function updateStatus(id, status) {
    const apiUrl = 'http://10.0.12.133/api/update-status';
    return axios.post(apiUrl, { id, status });
}

async function processCommand(command, id, tujuan) {
    let status;
    switch (command) {
        case 'Proses':
            status = 'proses';
            break;
        case 'Selesai':
            status = 'selesai';
            break;
        case 'Pending':
            status = 'pending';
            break;
        default:
            console.error('Invalid command');
            return;
    }

    try {
        const response = await updateStatus(id, status);
        let nohp = response.data.nohp;

        let pesan = `Terima Kasih Atas Laporannya ke Panraki APP! Status Laporan : *${status}*`

        client.sendMessage(tujuan, 'Terima Kasih Atas Responnya! Silahkan mengirimkan pesan lagi jika statusnya berubah');
        console.log(nohp)
        console.log(tujuan)
        try {
            await client.sendMessage(formatnomor(nohp), pesan);
            console.log('Message sent successfully');
        } catch (sendMessageError) {
            console.error('Error sending message:', sendMessageError);
        }

        console.log('API Response:', response.data);
    } catch (error) {
        console.error('API Error:', error.message);

    }
}

function formatnomor(nomor) {

    let hasil;
    hasil = `62${nomor.substring(1)}@c.us`;
    return hasil;
}

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})