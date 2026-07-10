exports.calculateStats = (req, res) => {
  try {
    const { matrices } = req.body;

    if (!matrices || !Array.isArray(matrices)) {
      return res.status(400).json({ error: 'Formato inválido. Se espera un arreglo de matrices.' });
    }

    let allValues = [];
    let isAnyDiagonal = false;

    matrices.forEach(matrix => {
      if (!Array.isArray(matrix)) return;
      
      let isDiagonal = true;
      const rows = matrix.length;
      
      for (let i = 0; i < rows; i++) {
        const row = matrix[i];
        if (!Array.isArray(row)) continue;
        const cols = row.length;
        
        if (rows !== cols) {
          isDiagonal = false;
        }

        for (let j = 0; j < cols; j++) {
          const val = row[j];
          allValues.push(val);
          
          if (i !== j && val !== 0) {
            isDiagonal = false;
          }
        }
      }

      if (isDiagonal && rows > 0) {
        isAnyDiagonal = true;
      }
    });

    if (allValues.length === 0) {
      return res.json({
        max: null,
        min: null,
        average: null,
        sum: 0,
        isDiagonal: false
      });
    }

    const sum = allValues.reduce((acc, curr) => acc + curr, 0);
    const max = Math.max(...allValues);
    const min = Math.min(...allValues);
    const average = sum / allValues.length;

    res.json({
      max,
      min,
      average,
      sum,
      isDiagonal: isAnyDiagonal
    });

  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
