function setupJoystick({ touchStartArea, container, handle, directionCallback }) {
            let isActive = false;
            
            function start(e) {
                e.preventDefault();
                isActive = true;
                handle.classList.add('active');
                move(e);
            }
            
            function move(e) {
                if (!isActive) return;
                e.preventDefault();
                
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                
                const rect = container.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                const deltaX = clientX - centerX;
                const deltaY = clientY - centerY;
                const maxRadius = container.offsetWidth / 2 - handle.offsetWidth / 2;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                
                let handleX = deltaX;
                let handleY = deltaY;
                
                if (distance > maxRadius) {
                    const angle = Math.atan2(deltaY, deltaX);
                    handleX = Math.cos(angle) * maxRadius;
                    handleY = Math.sin(angle) * maxRadius;
                }
                
                handle.style.transform = `translate(-50%, -50%) translate(${handleX}px, ${handleY}px)`;
                
                directionCallback(getDirection(handleX, handleY, maxRadius));
            }
            
            function end(e) {
                if (!isActive) return;
                e.preventDefault();
                isActive = false;
                handle.classList.remove('active');
                handle.style.transform = 'translate(-50%, -50%)';
                directionCallback('CENTER');
            }
            
            function getDirection(x, y, maxRadius) {
                const angle = Math.atan2(y, x) * (180 / Math.PI);
                const distance = Math.sqrt(x * x + y * y);
                
                if (distance < maxRadius * 0.3) return 'CENTER';
                if (angle >= -45 && angle < 45) return 'RIGHT';
                if (angle >= 45 && angle < 135) return 'DOWN';
                if (angle >= -135 && angle < -45) return 'UP';
                return 'LEFT';
            }
            
            // Event listeners
            touchStartArea.addEventListener('touchstart', start, { passive: false });
            touchStartArea.parentElement.addEventListener('mousedown', start);
            document.addEventListener('touchmove', move, { passive: false });
            document.addEventListener('mousemove', move);
            document.addEventListener('touchend', end);
            document.addEventListener('mouseup', end);
        }


        