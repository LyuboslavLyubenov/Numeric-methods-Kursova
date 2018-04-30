//import * as algebra from "./algebra-0.2.6.min";

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
        result += bit * Math.pow(1 / 2, index + 1);
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

/** Solve a linear system of equations given by a n&times;n matrix
 with a result vector n&times;1.
 https://martin-thoma.com/solving-linear-equations-with-gaussian-elimination/
 */
function gauss(A) {
    var n = A.length;

    for (var i = 0; i < n; i++) {
        // Search for maximum in this column
        var maxEl = Math.abs(A[i][i]);
        var maxRow = i;
        for (var k = i + 1; k < n; k++) {
            if (Math.abs(A[k][i]) > maxEl) {
                maxEl = Math.abs(A[k][i]);
                maxRow = k;
            }
        }

        // Swap maximum row with current row (column by column)
        for (var k = i; k < n + 1; k++) {
            var tmp = A[maxRow][k];
            A[maxRow][k] = A[i][k];
            A[i][k] = tmp;
        }

        // Make all rows below this one 0 in current column
        for (k = i + 1; k < n; k++) {
            var c = -A[k][i] / A[i][i];
            for (var j = i; j < n + 1; j++) {
                if (i == j) {
                    A[k][j] = 0;
                } else {
                    A[k][j] += c * A[i][j];
                }
            }
        }
    }

    // Solve equation Ax=b for an upper triangular matrix A
    var x = new Array(n);
    for (var i = n - 1; i > -1; i--) {
        x[i] = A[i][n] / A[i][i];
        for (var k = i - 1; k > -1; k--) {
            A[k][n] -= A[k][i] * x[i];
        }
    }
    return x;
}

function calculateSumOfNumbersInArray(array) {
    let result = 0;

    for (let i = 0; i < array.length; i++) {
        result += array[i];
    }

    return result;
}

function calculateFirstRowLeastSquaresMethod(points) {
    let row = [];

    row.push(points.length);

    let firstSum = calculateSumOfNumbersInArray(points.map(point => point['x']));
    row.push(firstSum);

    let secondSum = calculateSumOfNumbersInArray(points.map(point => point['y']));
    secondSum = parseFloat(secondSum.toString());
    row.push(secondSum);

    return row;
}

function calculateRowLeastSquaresMethod(points, rowIndex, power) {
    let row = [];

    for (let k = 0; k <= power; k++) {
        let leftPartPoints = points.map(point => Math.pow(point['x'], rowIndex + k));
        let leftPartSum = calculateSumOfNumbersInArray(leftPartPoints);
        row.push(leftPartSum);
    }

    let rightPartPoints = points.map(point => Math.pow(point['x'], rowIndex) * point['y']);
    let rightPartSum = calculateSumOfNumbersInArray(rightPartPoints);
    row.push(rightPartSum);

    return row;
}

function approximateXWithLeastSquaresMethod(points, power, x, roundTo) {
    console.log('Approximating with smallest squares method (only value)...');

    if (!roundTo) {
        roundTo = 3;
    }

    if (power === 0) {
        let result = calculateSumOfNumbersInArray(points.map(point => point['x']));
        result = result * (1 / points.length);
        return result;
    }

    let matrix = [];
    let row;

    for (let i = 0; i <= power; i++) {
        row = calculateRowLeastSquaresMethod(points, i, power).map(number => roundNumberTo(number, roundTo));
        matrix.push(row);
    }

    let gaussResult = gauss(matrix).map(number => roundNumberTo(number, roundTo));
    let endResult = gaussResult[0];

    for (let i = 1; i < gaussResult.length; i++) {
        endResult += Math.pow(-1, i + 1) * Math.pow(gaussResult[i], i) * Math.pow(x, i);
    }

    return endResult;
}