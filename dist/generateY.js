let p = 8710351092170399568734017n

let g = 38635475621555899789n

async function asyncReadFile(filename) {
    const contents = await fsPromises.readFile(filename, 'utf-8');
    const arr = contents.split(/\r?\n/);
    let arr2 = []
    arr.forEach((a) => {
        x = uuidToNum(a)
        y = modExp(g ,x , p)
        arr2.push(y)
    })
    console.log(arr2)
}


asyncReadFile('../validDrugIDs.txt');

const uuidToNum = (str) => {
    let newStr = str.replace(/-/g, "");
    newStr = "0x" + newStr
    return(BigInt(newStr))
}

const modExp = function (a, b, n) {
    a %= n;
    var rslt = 1n , x = a , lsb;
    while (b > 0) {
        lsb = b % 2n;
        b = b / 2n;
        if (lsb == 1n) {
            rslt = rslt * x;
            rslt = rslt % n;
        }
        x *= x ;
        x %= n;
    }
    return rslt;
};


