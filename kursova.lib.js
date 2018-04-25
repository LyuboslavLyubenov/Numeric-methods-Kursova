function calculateLogWithBase(number, base) {
    return Math.log(number) / (base ? Math.log(base) : 1);
}

function calculateRelativeError(number, numberApproximation) {
    return calculateAbsoluteError(number, numberApproximation) / Math.abs(number);
}

function calculateAbsoluteError(number, numberApproximation) {
    return Math.abs(number - numberApproximation);
}

function roundNumberTo(number, places) {
    return Math.round(number * Math.pow(10, places)) / Math.pow(10, places);
}

function convertToDecimal(binaryRepresentation) {
    if (binaryRepresentation.length !== 64) {
        throw 'Must be 64 bit binary number to convert to decimal';
    }
    
    console.log('Converting to decimal number: ' + binaryRepresentation);

    let sign = parseInt(binaryRepresentation[0]);
    let c = parseInt(binaryRepresentation.slice(1, 12), 2);
    let f = convertDecimalPart(binaryRepresentation.slice(12, 52));
    
    console.log([
        's = ' + sign,
        'c = ' + c,
        'f = ' + f
    ].join('\n'));
    
    return Math.pow(-1, sign) * Math.pow(2, c - 1023) * (1 + f);
}

function convertDecimalPart(decimalPart) {
    let result = 0;
    decimalPart.split('').forEach(function (bit, index) {
        result += bit * Math.pow(1/2, index + 1);
    });
    return result;
}

//https://stackoverflow.com/questions/1685680/how-to-avoid-scientific-notation-for-large-numbers-in-javascript
function removeScienceNotationFromNumber(x) {
    if (Math.abs(x) < 1.0) {
        var e = parseInt(x.toString().split('e-')[1]);
        if (e) {
            x *= Math.pow(10, e - 1);
            x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
        }
    } else {
        var e = parseInt(x.toString().split('+')[1]);
        if (e > 20) {
            e -= 20;
            x /= Math.pow(10, e);
            x += (new Array(e + 1)).join('0');
        }
    }
    return x;
}

function calculateRootWithBisectionMethod(a, b, f, tolerance) {
    const maxNumberOfIterations = 10000;

    if (!(a < b || (f(a) < 0 && f(b) > 0) || (f(a) > 0 && f(b) < 0))) {
        return 'Cant use bisection method';
    }

    console.log('Calculating root with bisection method...');

    let leftInterval = a;
    let rightInterval = b;

    if (f(a) === 0) {
        console.log('Root found: ' + a);
        return a;
    }

    if (f(b) === 0) {
        console.log('Root found: ' + a);
        return b;
    }

    let iterations = 0;

    while (true) { 
        let fa = f(a);
        let fb = f(b);
        let mid = (a + b) / 2;
        let fmid = f(mid);

        console.log([
            'fa = ' + fa,
            'fb = ' + fb,
            'mid = ' + mid,
            'fmid = ' + fmid 
        ].join('\n'));

        if (fmid === 0) {
            return mid;
        }

        if (Math.sign(fmid) === Math.sign(fa)) {
            a = mid;
        } else {
            b = mid;
        }

        if (Math.abs(a - b) < tolerance || ++iterations >= maxNumberOfIterations) {
            console.log('Root found: ' + mid);
            return mid;
        }
    }
}

function calculateRootWithFixedPointMethod(f, tolerance, startX) {
    const maxNumberOfIterations = 10000;

    let iterations = 0;
    let p1 = Math.random() * 100;

    if (startX) {
        p1 = startX;
    }

    while (++iterations < maxNumberOfIterations) {
        let p = f(p1);
        if (Math.abs(p - p1) < tolerance) {
            return p;
        }
        p1 = p;
    }

    return p1;
}

function reduceFractionInExpression(expression) {
    let regex = /[0-9]+\/[0-9]+/g;
    let match = regex.exec(expression);
    return expression.replace(regex, function (match) { 
        return Ratio.parse(match).simplify().toString();
    });
}

//f -> function generating the expression
//start -> start index (inc)
//end -> end index (inc)
//operation -> '*', '-'... etc
//returns generated expressions (algebra obj) from function with {operation} symbol in between
function performOperationBetweenExpressions(f, start, end, operation) {
    let result = [];

    for (let i = start; i <= end; i++) {
        let fResult = f(i);
        if (fResult) {
            result.push('(' + fResult + ')');   
        }
    }

    result = result.join(operation);
    return algebra.parse(result);
}

function calculateProduct(f, start, end) {
    return performOperationBetweenExpressions(f, start, end, '*');
}

function calculateSum(f, start, end) {
    return performOperationBetweenExpressions(f, start, end, '+');
}

function calculateFirstExpressionLagrance(points, k, power) {
    let product = calculateProduct(function (i) {
        if (i === k) {
            return;
        }
        return points[k].x - points[i].x;
    }, 0, power).toString();
   
    return points[k].y / parseFloat(product);
}

function calculateSecondExpressionLagrance(points, k, power) {
    return calculateProduct(function (i) {
        if (i === k) {
            return;
        }
        return 'x - (' + points[i].x + ')';
    }, 0, power);
}

function calculateSecondExpressionLagranceWithKnownX(points, k, power, x) {
    let product = calculateProduct(function (i) {
        if (i === k) {
            return;
        }
        return x - points[i].x;
    }, 0, power);

    product = eval(product.toString()); 
    return product;
}

function approximateFunctionWithLagranceMethod(points, power) {
    console.log('Approximating with lagrance (function)...');
    
    let result = calculateSum(function (k) {
        console.log('Iteration ' + k);

        let expression = '';
        let firstPartOfExpression = calculateFirstExpressionLagrance(points, k, power).toString();
        let secondPartOfExpression = calculateSecondExpressionLagrance(points, k, power).toString();
        
        expression += '(' + firstPartOfExpression + ')';
        expression += '*';
        expression += '(' + secondPartOfExpression + ')';

        console.log('Expression: ' + expression.toString());

        return expression.toString();
    }, 0, power);

    result = result.simplify().toString();
    result = reduceFractionInExpression(result);
    console.log(result);

    return result;
}

function approximateXWithLagranceMethod(points, power, x) {
    console.log('Approximating with lagrance (only value)...');

    let result = calculateSum(function (k) {
        console.log('Iteration ' + k);

        let expression = 0;
        let firstPartOfExpression = calculateFirstExpressionLagrance(points, k, power);
        let secondPartOfExpression = calculateSecondExpressionLagranceWithKnownX(points, k, power, x);

        console.log('First part of expression: ' + firstPartOfExpression);
        console.log('Second part of expression: ' + secondPartOfExpression);

        expression += firstPartOfExpression * secondPartOfExpression;

        console.log('Expression: ' + expression.toString());

        return expression;        
    }, 0, power);

    return result.toString();
}

function approximateFunctionWithNewtonMethod(points, power, x) {
    let result = points[0].y;
    result += calculateSum(function (index) {
        
    }, 1, points.length);
    result *= calculateProduct(function (index) {

    }, 0, );

}

