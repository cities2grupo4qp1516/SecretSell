var secretSale = angular.module('secretSale', ['jsbn.BigInteger', 'ui.router']);

secretSale.constant('config', {
    URLSSS: "http://localhost:3000/",
    URLTTP: "https://localhost:5000/"
});

secretSale.controller("RegVendedorController", function ($scope, UtilSrvc, $http, config, BigInteger, rsaKey, $state, Base64, $timeout) {
    function downloadURI(uri, name) {
        var link = document.createElement("a");
        link.download = name;
        link.href = uri;
        link.click();
    }

    var keys, seudo_Kpub, teta, r, n, e, c, myHash, pass_rc4, publickey = {
        bits: "",
        n: "",
        e: ""
    };
    $scope.claves = false;
    $scope.prep = false;
    $scope.generar = true;
    $scope.ver = false;
    $scope.label_seudo = false;
    $scope.hash = false;
    $scope.firma_ceg = false;
    $scope.send = false;
    $scope.des = false;
    $scope.ceg = false;
    $scope.veri = false;
    $scope.pergamino = true;
    $scope.pergamino2 = false;
    $scope.teta_server = false;
    $scope.rmenos1 = false;
    $scope.ver_hash = false;
    $scope.save = false;
    $scope.rc4_pass = false;
    $scope.cif = "";
    $scope.direccion = "";
    $scope.email = "";
    $scope.telf = "";


    $("#seudo").hide();

    $http.get(config.URLTTP + 'firma_ciega/publicKey').success(function (data) {
        publickey = {
            bits: data.bits,
            n: data.n,
            e: data.e
        };
    }).error(function (data) {
        console.log('Error: ' + data);
    });

    $scope.validar = function () {
        if ($scope.cif == "" || $scope.direccion == "" || $scope.email == "" || $scope.telf == "") {
            console.log("Debes rellenar todos los campos");
        } else {
            $("#contact").fadeOut(2000);
            setTimeout(function () {
                $("#seudo").fadeIn(2000);
            }, 2000);
        }
    };

    $scope.generar = function () {
        $scope.claves = false;
        keys = rsaKey.generateKeys(1024);

        $scope.claves = true;
        $scope.label_seudo = true;
        $scope.generar = false;
        $scope.ver = true;
        $scope.prep = true;
        $("#ver").trigger("click");

        $scope.public = {
            n: keys.publicKey.n.toString(),
            e: keys.publicKey.e.toString()
        };
        $scope.private = {
            d: keys.privateKey.d.toString()
        };
    };

    $scope.guardar_keys = function () {
        var keysToFile = {
            publicKey: {
                n: keys.publicKey.n.toString(),
                e: keys.publicKey.e.toString(),
                bits: keys.publicKey.bits
            },
            privateKey: {
                p: keys.privateKey.p.toString(),
                q: keys.privateKey.q.toString(),
                d: keys.privateKey.d.toString(),
                publicKey: {
                    n: keys.publicKey.n.toString(),
                    e: keys.publicKey.e.toString(),
                    bits: keys.publicKey.bits
                }
            }
        };
        var file = "";
        var data = new Blob([Base64.encode(JSON.stringify(keysToFile))], {
            type: 'text/plain'
        });

        if (file !== null) {
            window.URL.revokeObjectURL(file);
        }

        file = window.URL.createObjectURL(data);
        downloadURI(file, "keys.RSA");

    };

    $scope.preparar = function (seudonimo) {
        seudo_Kpub = seudonimo + "," + keys.publicKey.e.toString() + "," + keys.publicKey.n.toString();
        $scope.seudo_Kpub = {
            seudonimo: seudonimo,
            n: keys.publicKey.n.toString(),
            e: keys.publicKey.e.toString()
        };

    };

    $scope.hashear = function () {
        $scope.pergamino = false;
        $scope.hash = true;
        $scope.ceg = true;

        myHash = sha256($scope.seudo_Kpub.seudonimo + "," + $scope.seudo_Kpub.n + "," + $scope.seudo_Kpub.e);
        $scope.digest = myHash;
    };

    $scope.cegar = function () {
        $scope.firma_ceg = true;
        $scope.send = true;
        $scope.ceg = false;

        var hash = {
            hash: $scope.digest
        };

        console.log("HASH: " + $scope.digest);
        var diff = Decimal.sub(Decimal.pow(2, publickey.bits), Decimal.pow(2, publickey.bits - 1));
        var randomNumber = Decimal.add((Decimal.mul(Decimal.random(300), Decimal.pow(2, publickey.bits)).round()), diff);
        r = new BigInteger(randomNumber.toString());

        console.log("R: " + r);

        var m = new BigInteger(hash.hash, 16);
        e = new BigInteger(publickey.e);
        n = new BigInteger(publickey.n);
        var bc = m.multiply(r.modPow(e, n)).mod(n);

        $scope.blindMsg = {
            blind: bc.toString(10)
        };
        console.log('blind msg   m·r^e mod n:', '\n', $scope.blindMsg.blind.toString(10), '\n');
    };

    $scope.enviar = function () {

        $http.post(config.URLTTP + 'firma_ciega', JSON.stringify($scope.blindMsg))
            .success(function (data) {
                teta = new BigInteger(data.teta);
                $scope.teta = teta.toString(10);

            })
            .error(function (dataa) {
                console.log('Error: ' + dataa);
            });

        $scope.send = false;
        $scope.ceg = false;
        $scope.des = true;
        $scope.teta_server = true;
    };

    $scope.descegar = function () {
        $scope.rmenos1 = true;
        $scope.teta_server = false;
        $scope.firma_ceg = false;
        $scope.des = false;
        $scope.veri = true;
        c = teta.multiply(r.modInverse(n)).mod(n);
        $scope.c = c.toString();

    };

    $scope.verificar = function () {
        var publicKeyTTP = new rsaKey.publicKey(publickey.bits, n, e);
        var d = publicKeyTTP.decrypt(c);
        $scope.d = d.toString(16);

        if (myHash == d.toString(16)) {
            $("#digest").css("color", "#0C9700");
            $("#digest_ver").css("color", "#0C9700");

        } else {
            $("#digest").css("color", "#D8270F");
            $("#digest_ver").css("color", "#D8270F");
        }
        $scope.rmenos1 = false;
        $scope.ver_hash = true;

        $scope.rc4_pass = true;
        $scope.veri = false;

      /*  $timeout(function () {

      }, 5000);*/
    };


    $scope.save_pass_rc4 = function (rc4_que_me_envia_el_html) {
      $scope.ver_hash = false;
      $scope.hash = false;
      $scope.veri = false;
      $scope.pergamino2 = true;
      $scope.save = true;
      $scope.rc4_pass = false;
      pass_rc4 = rc4_que_me_envia_el_html;
    };

    $scope.guardar = function () {
        //s,e,n,c
        var seudo_Kpub_sign = seudo_Kpub + "," + c;

        var temp = seudo_Kpub_sign.split(',');
        var certificadoFinal = {
            seudonimo: temp[0],
            e: temp[1],
            n: temp[2],
            firma: temp[3],
            d: Base64.encode(rc4(pass_rc4, keys.privateKey.d.toString()))
        }
        console.log(rc4(pass_rc4, keys.privateKey.d.toString()));
        console.log(certificadoFinal);
        var file = "";
        var data = new Blob([Base64.encode(JSON.stringify(certificadoFinal))], {
            type: 'text/plain'
        });

        if (file !== null) {
            window.URL.revokeObjectURL(file);
        }

        file = window.URL.createObjectURL(data);
        downloadURI(file, "PID_firmado.RSA");
    };

    function rc4(key, str) {
        var s = [],
            j = 0,
            a, res = '';
        for (var i = 0; i <= 255; i++) {
            s[i] = i;
        }
        for (i = 0; i <= 255; i++) {
            j = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
            a = s[i];
            s[i] = s[j];
            s[j] = a;
        }
        i = 0;
        j = 0;
        for (var b = 0; b < str.length; b++) {
            i = (i + 1) % 256;
            j = (j + s[i]) % 256;
            a = s[i];
            s[i] = s[j];
            s[j] = a;
            res += String.fromCharCode(str.charCodeAt(b) ^ s[(s[i] + s[j]) % 256]);
        }
        return res;
    }
})

.factory('rsaKey', ['BigInteger', 'primeNumber', function (BigInteger, primeNumber) {
        var rsa = {
            publicKey: function (bits, n, e) {
                this.bits = bits;
                this.n = n;
                this.e = e;
            },
            privateKey: function (p, q, d, publicKey) {
                this.p = p;
                this.q = q;
                this.d = d;
                this.publicKey = publicKey;
            },
            importKeys: function (impotedKeys) {
                var keys = {};
                impotedKeys.privateKey.publicKey.e = new BigInteger(impotedKeys.privateKey.publicKey.e);
                impotedKeys.privateKey.publicKey.n = new BigInteger(impotedKeys.privateKey.publicKey.n);
                keys.publicKey = new rsa.publicKey(impotedKeys.publicKey.bits, new BigInteger(impotedKeys.publicKey.n), new BigInteger(impotedKeys.publicKey.e));
                keys.privateKey = new rsa.privateKey(new BigInteger(impotedKeys.privateKey.p), new BigInteger(impotedKeys.privateKey.q), new BigInteger(impotedKeys.privateKey.d), impotedKeys.privateKey.publicKey);
                return keys;
            },
            generateKeys: function (bitlength) {
                var p, q, n, phi, e, d, keys = {},
                    one = new BigInteger('1');
                this.bitlength = bitlength || 2048;
                console.log("Generating RSA keys of", this.bitlength, "bits");
                p = primeNumber.aleatorio(bitlength);
                do {
                    q = primeNumber.aleatorio(bitlength);
                } while (q.compareTo(p) === 0);
                n = p.multiply(q);

                phi = p.subtract(one).multiply(q.subtract(one));

                e = new BigInteger('65537');
                d = e.modInverse(phi);

                keys.publicKey = new rsa.publicKey(this.bitlength, n, e);
                keys.privateKey = new rsa.privateKey(p, q, d, keys.publicKey);
                return keys;
            },
            String2bin: function (str) {
                var bytes = [];
                for (var i = 0; i < str.length; ++i) {
                    bytes.push(str.charCodeAt(i));
                }
                return bytes;
            },
            bin2String: function (array) {
                var result = "";
                for (var i = 0; i < array.length; i++) {
                    result += String.fromCharCode(array[i]);
                }
                return result;
            }
        };


        rsa.publicKey.prototype = {
            encrypt: function (m) {
                return m.modPow(this.e, this.n);
            },
            decrypt: function (c) {
                return c.modPow(this.e, this.n);
            },
            dec: function (c, pass, passs) {
                return c.modPow(pass, passs);
            }
        };

        rsa.privateKey.prototype = {
            encrypt: function (m) {
                return m.modPow(this.d, this.publicKey.n);
            },
            decrypt: function (c) {
                return c.modPow(this.d, this.publicKey.n);
            }
        };
        return rsa;
}])
    .factory('primeNumber', ['BigInteger', function (BigInteger) {
        Decimal.config({
            precision: 300,
            rounding: 4,
            toExpNeg: -7,
            toExpPos: 100,
            maxE: 9e15,
            minE: -9e15
        });
        var primo = {
            aleatorio: function (bitLength) {
                var isPrime = false;
                var diff = Decimal.sub(Decimal.pow(2, bitLength), Decimal.pow(2, bitLength - 1));
                while (!isPrime) {
                    var randomNumber = Decimal.add((Decimal.mul(Decimal.random(300), Decimal.pow(2, bitLength)).round()), diff);
                    var rnd = new BigInteger(randomNumber.toString());
                    if (rnd.isProbablePrime(3)) {
                        isPrime = true;
                    }
                }
                return rnd;
            }
        };
        return primo;
}]).factory('Base64', [function () {
        var Base64 = {
            _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
            encode: function (e) {
                var t = "";
                var n, r, i, s, o, u, a;
                var f = 0;
                e = Base64._utf8_encode(e);
                while (f < e.length) {
                    n = e.charCodeAt(f++);
                    r = e.charCodeAt(f++);
                    i = e.charCodeAt(f++);
                    s = n >> 2;
                    o = (n & 3) << 4 | r >> 4;
                    u = (r & 15) << 2 | i >> 6;
                    a = i & 63;
                    if (isNaN(r)) {
                        u = a = 64
                    } else if (isNaN(i)) {
                        a = 64
                    }
                    t = t + this._keyStr.charAt(s) + this._keyStr.charAt(o) + this._keyStr.charAt(u) + this._keyStr.charAt(a)
                }
                return t
            },
            decode: function (e) {
                var t = "";
                var n, r, i;
                var s, o, u, a;
                var f = 0;
                e = e.replace(/[^A-Za-z0-9\+\/\=]/g, "");
                while (f < e.length) {
                    s = this._keyStr.indexOf(e.charAt(f++));
                    o = this._keyStr.indexOf(e.charAt(f++));
                    u = this._keyStr.indexOf(e.charAt(f++));
                    a = this._keyStr.indexOf(e.charAt(f++));
                    n = s << 2 | o >> 4;
                    r = (o & 15) << 4 | u >> 2;
                    i = (u & 3) << 6 | a;
                    t = t + String.fromCharCode(n);
                    if (u != 64) {
                        t = t + String.fromCharCode(r)
                    }
                    if (a != 64) {
                        t = t + String.fromCharCode(i)
                    }
                }
                t = Base64._utf8_decode(t);
                return t
            },
            _utf8_encode: function (e) {
                e = e.replace(/\r\n/g, "\n");
                var t = "";
                for (var n = 0; n < e.length; n++) {
                    var r = e.charCodeAt(n);
                    if (r < 128) {
                        t += String.fromCharCode(r)
                    } else if (r > 127 && r < 2048) {
                        t += String.fromCharCode(r >> 6 | 192);
                        t += String.fromCharCode(r & 63 | 128)
                    } else {
                        t += String.fromCharCode(r >> 12 | 224);
                        t += String.fromCharCode(r >> 6 & 63 | 128);
                        t += String.fromCharCode(r & 63 | 128)
                    }
                }
                return t
            },
            _utf8_decode: function (e) {
                var t = "";
                var n = 0;
                var r = c1 = c2 = 0;
                while (n < e.length) {
                    r = e.charCodeAt(n);
                    if (r < 128) {
                        t += String.fromCharCode(r);
                        n++
                    } else if (r > 191 && r < 224) {
                        c2 = e.charCodeAt(n + 1);
                        t += String.fromCharCode((r & 31) << 6 | c2 & 63);
                        n += 2
                    } else {
                        c2 = e.charCodeAt(n + 1);
                        c3 = e.charCodeAt(n + 2);
                        t += String.fromCharCode((r & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
                        n += 3
                    }
                }
                return t
            }
        }
        return Base64;
}]);
