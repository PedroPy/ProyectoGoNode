package handlers

import (
	"math"

	"github.com/gofiber/fiber/v2"
	"gonum.org/v1/gonum/mat"
)

type MatrixRequest struct {
	Matrix [][]float64 `json:"matrix"`
}

func rotar(matrix [][]float64) [][]float64 {
	rows := len(matrix)
	cols := len(matrix[0])
	rotated := make([][]float64, cols)
	for i := range rotated {
		rotated[i] = make([]float64, rows)
	}
	for i := 0; i < rows; i++ {
		for j := 0; j < cols; j++ {
			rotated[j][rows-1-i] = matrix[i][j]
		}
	}
	return rotated
}

func RotateMatrix(c *fiber.Ctx) error {
	var req MatrixRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Formato JSON inválido"})
	}

	matrix := req.Matrix
	if len(matrix) == 0 || len(matrix[0]) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Matriz vacía"})
	}

	cols := len(matrix[0])
	for _, row := range matrix {
		if len(row) != cols {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "La matriz no es rectangular"})
		}
	}

	rotated := rotar(matrix)

	return c.JSON(fiber.Map{
		"result": rotated,
	})
}

func QRHouseholder(c *fiber.Ctx) error {
	var req MatrixRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Formato JSON inválido"})
	}

	matrix := req.Matrix
	if len(matrix) == 0 || len(matrix[0]) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Matriz vacía"})
	}

	cols := len(matrix[0])
	for _, row := range matrix {
		if len(row) != cols {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "La matriz no es rectangular"})
		}
	}

	// 1. Primero rotamos la matriz dentro del backend
	MatrixRotada := rotar(matrix)

	// 2. Ahora calculamos QR usando la matriz rotada
	//Gonum implementa o hace interfaz con rutinas basadas en el estándar LAPACK para sus operaciones
	//de álgebra lineal subyacentes. El estándar para la factorización QR en librerías de producción
	//orientadas al rendimiento y precisión es utilizar transformaciones de Householder
	rows := len(MatrixRotada)
	cols = len(MatrixRotada[0])

	//3. Preparación de Datos para la librería Gonum
	data := make([]float64, 0, rows*cols)
	for _, row := range MatrixRotada {
		data = append(data, row...)
	}

	//4. Factorización QR
	m := mat.NewDense(rows, cols, data)
	var qr mat.QR
	qr.Factorize(m)

	//5. Extracción de las Matrices Q y R
	var q, r mat.Dense
	qr.QTo(&q)
	qr.RTo(&r)

	qRows, qCols := q.Dims()
	rRows, rCols := r.Dims()
	//6. Conversión de vuelta a Slices 2D
	qSlice := make([][]float64, qRows)
	for i := 0; i < qRows; i++ {
		qSlice[i] = make([]float64, qCols)
		for j := 0; j < qCols; j++ {
			qSlice[i][j] = q.At(i, j)
		}
	}

	rSlice := make([][]float64, rRows)
	for i := 0; i < rRows; i++ {
		rSlice[i] = make([]float64, rCols)
		for j := 0; j < rCols; j++ {
			rSlice[i][j] = r.At(i, j)
		}
	}

	return c.JSON(fiber.Map{
		"Rotada": MatrixRotada,
		"q":      qSlice,
		"r":      rSlice,
	})
}

func gramSchmidt(A [][]float64) (Q [][]float64, R [][]float64) {
	rows := len(A)
	if rows == 0 {
		return
	}
	cols := len(A[0])

	Q = make([][]float64, rows)
	for i := range Q {
		Q[i] = make([]float64, cols)
	}
	R = make([][]float64, cols)
	for i := range R {
		R[i] = make([]float64, cols)
	}

	for j := 0; j < cols; j++ {
		u_j := make([]float64, rows)
		for i := 0; i < rows; i++ {
			u_j[i] = A[i][j]
		}

		for k := 0; k < j; k++ {
			dot := 0.0
			for i := 0; i < rows; i++ {
				dot += Q[i][k] * u_j[i]
			}
			R[k][j] = dot

			for i := 0; i < rows; i++ {
				u_j[i] -= dot * Q[i][k]
			}
		}

		norm := 0.0
		for i := 0; i < rows; i++ {
			norm += u_j[i] * u_j[i]
		}
		norm = math.Sqrt(norm)
		R[j][j] = norm

		for i := 0; i < rows; i++ {
			if norm > 0 {
				Q[i][j] = u_j[i] / norm
			} else {
				Q[i][j] = 0
			}
		}
	}
	return Q, R
}

func givensQR(A [][]float64) (Q [][]float64, R [][]float64) {
	rows := len(A)
	if rows == 0 {
		return
	}
	cols := len(A[0])

	R = make([][]float64, rows)
	for i := range R {
		R[i] = make([]float64, cols)
		copy(R[i], A[i])
	}

	Q = make([][]float64, rows)
	for i := range Q {
		Q[i] = make([]float64, rows)
		Q[i][i] = 1.0
	}

	for j := 0; j < cols; j++ {
		for i := rows - 1; i > j; i-- {
			if R[i][j] != 0 {
				a := R[i-1][j]
				b := R[i][j]
				r := math.Hypot(a, b)
				c := a / r
				s := -b / r

				for k := 0; k < cols; k++ {
					temp1 := c*R[i-1][k] - s*R[i][k]
					temp2 := s*R[i-1][k] + c*R[i][k]
					R[i-1][k] = temp1
					R[i][k] = temp2
				}

				for k := 0; k < rows; k++ {
					temp1 := c*Q[k][i-1] - s*Q[k][i]
					temp2 := s*Q[k][i-1] + c*Q[k][i]
					Q[k][i-1] = temp1
					Q[k][i] = temp2
				}
			}
		}
	}
	return Q, R
}

func QRMatrixGramSchmidt(c *fiber.Ctx) error {
	var req MatrixRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Formato JSON inválido"})
	}

	matrix := req.Matrix
	if len(matrix) == 0 || len(matrix[0]) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Matriz vacía"})
	}

	cols := len(matrix[0])
	for _, row := range matrix {
		if len(row) != cols {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "La matriz no es rectangular"})
		}
	}

	MatrixRotada := rotar(matrix)
	qSlice, rSlice := gramSchmidt(MatrixRotada)

	return c.JSON(fiber.Map{
		"Rotada": MatrixRotada,
		"q":      qSlice,
		"r":      rSlice,
	})
}

func QRMatrixGivens(c *fiber.Ctx) error {
	var req MatrixRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Formato JSON inválido"})
	}

	matrix := req.Matrix
	if len(matrix) == 0 || len(matrix[0]) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Matriz vacía"})
	}

	cols := len(matrix[0])
	for _, row := range matrix {
		if len(row) != cols {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "La matriz no es rectangular"})
		}
	}

	MatrixRotada := rotar(matrix)
	qSlice, rSlice := givensQR(MatrixRotada)

	return c.JSON(fiber.Map{
		"Rotada": MatrixRotada,
		"q":      qSlice,
		"r":      rSlice,
	})
}
