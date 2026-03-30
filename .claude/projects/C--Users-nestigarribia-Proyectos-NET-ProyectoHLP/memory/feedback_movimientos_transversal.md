---
name: Movimientos es transversal
description: La tabla Movimientos debe registrar TODA acción que afecte stock o caja. No crear tablas paralelas de movimientos.
type: feedback
---

La tabla Movimientos es transversal a todo el sistema. Cada acción que afecte el stock o la caja debe reflejarse ahí. No generar tablas paralelas de movimientos para módulos específicos (cuenta corriente, etc.). Usar CodigosAccion para diferenciar los tipos.

**Why:** El usuario quiere un único punto de verdad para auditoría y trazabilidad de todo movimiento financiero y de stock del sistema.

**How to apply:** Siempre que se implemente una nueva funcionalidad que afecte dinero o stock, registrar en la tabla Movimientos existente con un CodigoAccion apropiado. Nunca crear tablas tipo "MovimientosCuentaCorriente" o similares.
