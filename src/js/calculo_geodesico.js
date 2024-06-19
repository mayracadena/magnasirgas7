document.addEventListener('DOMContentLoaded', () => {
    const radioButtons = document.querySelectorAll('input[type="radio"]');
    
    radioButtons.forEach(radioButton => {
      radioButton.addEventListener('click', (event) => {
        const selectedOption = event.target.value;
        console.log(`Opción seleccionada: ${selectedOption}`);
        
        // Aquí puedes realizar cualquier acción adicional basada en la opción seleccionada
        // Por ejemplo, actualizar otra parte de la interfaz o enviar datos al servidor, etc.
      });
    });
  });