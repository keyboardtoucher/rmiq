export default function handler(req, res) {
  console.log('HELLO');
  res.status(200).json({ ok: true });
}