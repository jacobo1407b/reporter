const cadena = "TOKS0187 - TOKS PACHUCA COLOSIO";
const resultado = cadena.match(/TOKS\d*?(\d{2})\b/)[1]; // "87"

console.log(resultado);